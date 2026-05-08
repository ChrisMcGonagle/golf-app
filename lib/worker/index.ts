/**
 * Background worker service for integration queue processing
 * Polls the integration_queue table, executes adapters, and updates status
 */

import { randomUUID } from 'crypto';
import { dequeue, DequeuedIntegrationQueueItem } from '@/lib/queue/dequeue';
import { createAdapterByName } from '@/lib/integrations/factory';
import {
  ExecutionContext,
  IntegrationLogger,
  IntegrationRequest,
  JsonObject,
} from '@/lib/integrations/types';
import { createServiceRoleClient } from '@/lib/supabase/server';

// ============================================================
// Constants & Configuration
// ============================================================

const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_WORKER_ID = () => `worker-${randomUUID()}`;

// ============================================================
// Structured Logger
// ============================================================

class StructuredLogger implements IntegrationLogger {
  info(message: string, data?: JsonObject): void {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...data,
      })
    );
  }

  warn(message: string, data?: JsonObject): void {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...data,
      })
    );
  }

  error(message: string, data?: JsonObject): void {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        timestamp: new Date().toISOString(),
        ...data,
      })
    );
  }
}

// ============================================================
// Success Handler
// ============================================================

async function handleSuccess(
  queueEntryId: string,
  requestId: string,
  adapterName: string,
  externalId: string,
  logger: IntegrationLogger
): Promise<void> {
  const supabase = createServiceRoleClient();

  logger.info('processing_succeeded', {
    event_type: 'processing_succeeded',
    adapter_name: adapterName,
    externalId,
    request_id: requestId,
  });

  // Map adapter name to column name (e.g., 'golf_ireland' -> 'golfireland_account')
  const columnMap: Record<string, string> = {
    mock: 'golfireland_account',
    golf_ireland: 'golfireland_account',
    brs: 'brs_account',
    clubv1: 'clubv1_account',
  };

  const columnName = columnMap[adapterName] || 'golfireland_account';

  // Update membership_requests with externalId
  const { error: updateError } = await supabase
    .from('membership_requests')
    .update({
      [columnName]: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    throw new Error(`Failed to update membership_requests: ${updateError.message}`);
  }

  // Update queue entry as completed
  const { error: queueError } = await supabase
    .from('integration_queue')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', queueEntryId);

  if (queueError) {
    throw new Error(`Failed to update queue entry: ${queueError.message}`);
  }
}

// ============================================================
// Failure Handler
// ============================================================

async function handleFailure(
  queueEntryId: string,
  requestId: string,
  adapterName: string,
  error: string,
  screenshotPath: string | undefined,
  logger: IntegrationLogger
): Promise<void> {
  const supabase = createServiceRoleClient();

  const errorLog: JsonObject = {
    event_type: 'processing_failed',
    adapter_name: adapterName,
    error_message: error,
    request_id: requestId,
  };

  if (screenshotPath) {
    errorLog.screenshot_path = screenshotPath;
  }

  logger.error('processing_failed', errorLog);

  // Update queue entry as failed with error details
  const { error: queueError } = await supabase
    .from('integration_queue')
    .update({
      status: 'failed',
      last_error: error,
      last_error_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', queueEntryId);

  if (queueError) {
    throw new Error(`Failed to update queue entry: ${queueError.message}`);
  }
}

// ============================================================
// Process Single Queue Entry
// ============================================================

async function processQueueEntry(
  queueEntry: DequeuedIntegrationQueueItem,
  workerId: string,
  logger: IntegrationLogger
): Promise<void> {
  const queueEntryId = queueEntry.id;
  const requestId = queueEntry.requestId;
  const requestType = queueEntry.requestType;
  const payload = queueEntry.payload;

  logger.info('queue_entry_received', {
    event_type: 'queue_entry_received',
    queue_id: queueEntryId,
    request_id: requestId,
  });

  try {
    // Instantiate adapter
    logger.info('adapter_instantiation_started', {
      event_type: 'adapter_instantiation_started',
      adapter_name: requestType,
      request_id: requestId,
    });

    const adapter = createAdapterByName(requestType);

    // Create execution context
    const context: ExecutionContext = {
      workerId,
      requestId,
      queueEntryId,
      logger,
    };

    // Validate request
    const request: IntegrationRequest = {
      id: queueEntryId,
      request_type: requestType,
      payload,
      request_id: requestId,
    };

    adapter.validate(request);

    // Execute adapter
    logger.info('adapter_execution_started', {
      event_type: 'adapter_execution_started',
      adapter_name: requestType,
      request_id: requestId,
    });

    const response = await adapter.execute(request, context);

    // Handle response
    if (response.success && response.externalId) {
      await handleSuccess(queueEntryId, requestId, requestType, response.externalId, logger);
    } else {
      const errorMessage = response.error || 'Unknown error';
      await handleFailure(
        queueEntryId,
        requestId,
        requestType,
        errorMessage,
        response.screenshotPath,
        logger
      );
    }

    // Optional cleanup
    if (adapter.cleanup) {
      await adapter.cleanup(context);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await handleFailure(queueEntryId, requestId, requestType, errorMessage, undefined, logger);
  }
}

// ============================================================
// Worker Main Loop
// ============================================================

let isShuttingDown = false;
let inFlightCount = 0;

async function runWorker(): Promise<void> {
  const logger = new StructuredLogger();

  const workerId = process.env.INTEGRATION_WORKER_ID || DEFAULT_WORKER_ID();
  const pollIntervalMs = parseInt(process.env.INTEGRATION_QUEUE_POLL_INTERVAL_MS || '', 10) || DEFAULT_POLL_INTERVAL_MS;
  const batchSize = 10;

  logger.info('worker_polling_started', {
    event_type: 'worker_polling_started',
    worker_id: workerId,
    poll_interval_ms: pollIntervalMs,
  });

  // Main polling loop
  while (!isShuttingDown) {
    try {
      const queueEntries = await dequeue(workerId, batchSize);

      if (queueEntries.length === 0) {
        // No items available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        continue;
      }

      // Process all dequeued entries in parallel
      const promises = queueEntries.map((entry) => {
        inFlightCount++;
        return processQueueEntry(entry, workerId, logger)
          .catch((error) => {
            logger.error('queue_processing_error', {
              queue_id: entry.id,
              error_message: error instanceof Error ? error.message : String(error),
            });
          })
          .finally(() => {
            inFlightCount--;
          });
      });

      await Promise.all(promises);

      // Yield briefly before next poll
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('polling_error', {
        error_message: error instanceof Error ? error.message : String(error),
      });
      // Wait before retrying on error
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  logger.info('worker_polling_stopped', {
    event_type: 'worker_polling_stopped',
    worker_id: workerId,
  });
}

// ============================================================
// Graceful Shutdown
// ============================================================

async function setupGracefulShutdown(logger: IntegrationLogger): Promise<void> {
  const handleShutdown = async (signal: string) => {
    logger.info('graceful_shutdown_initiated', {
      event_type: 'graceful_shutdown_initiated',
      signal,
      in_flight_count: inFlightCount,
    });

    isShuttingDown = true;

    // Wait for in-flight requests to complete
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    while (inFlightCount > 0 && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (inFlightCount > 0) {
      logger.warn('graceful_shutdown_timeout', {
        event_type: 'graceful_shutdown_timeout',
        in_flight_count: inFlightCount,
      });
    }

    logger.info('graceful_shutdown_complete', {
      event_type: 'graceful_shutdown_complete',
    });

    process.exit(0);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

// ============================================================
// Entrypoint
// ============================================================

async function main(): Promise<void> {
  const logger = new StructuredLogger();

  try {
    await setupGracefulShutdown(logger);
    await runWorker();
  } catch (error) {
    logger.error('worker_startup_error', {
      error_message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Only run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runWorker, StructuredLogger };
