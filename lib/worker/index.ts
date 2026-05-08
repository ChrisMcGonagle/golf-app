/**
 * Background worker service for integration queue processing
 * Polls the integration_queue table, executes adapters, and updates status
 */

import { randomUUID } from 'crypto';
import { updateMembershipRequest, MembershipRequestUpdate } from '../actions/updateMembershipRequest';
import { dequeue, DequeuedIntegrationQueueItem } from '../queue/dequeue';
import { createAdapterByName, resolveAdapterNameForRequestType } from '../integrations/factory';
import {
  ExecutionContext,
  IntegrationLogger,
  IntegrationRequest,
  JsonObject,
  LogEntry,
} from '../integrations/types';
import { createServiceRoleClient } from '../supabase/server';

// ============================================================
// Constants & Configuration
// ============================================================

const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_WORKER_ID = () => `worker-${randomUUID()}`;
const FATAL_RUNTIME_FAILURE_MESSAGE =
  'Worker runtime failed before the job completed; marked failed as abandoned.';
const SHUTDOWN_FAILURE_MESSAGE =
  'Worker shutdown before the job completed; marked failed as abandoned.';

type InFlightQueueEntryState = {
  queueEntryId: string;
  requestId: string;
  adapterName: string | null;
  didStepStart: boolean;
  stepOutcomePersisted: boolean;
};

type QueueEntryProcessingFailureContext = {
  queueEntryId: string;
  requestId: string;
  adapterName: string | null;
  didStepStart: boolean;
  stepOutcomePersisted: boolean;
};

function buildWorkerLog(entry: JsonObject): JsonObject {
  return {
    adapter_name: null,
    error_message: null,
    event_type: null,
    external_id: null,
    screenshot_path: null,
    ...entry,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getScreenshotPathFromError(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const screenshotPath = (error as { screenshotPath?: unknown }).screenshotPath;
  return typeof screenshotPath === 'string' ? screenshotPath : undefined;
}

function isMissingScreenshotPathColumn(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes('screenshot_path') && normalizedMessage.includes('column');
}

type MembershipRequestStepColumn = keyof Pick<
  MembershipRequestUpdate,
  'golfireland_account' | 'brs_account' | 'clubv1_account'
>;

const MEMBERSHIP_REQUEST_STEP_COLUMN_BY_ADAPTER: Record<string, MembershipRequestStepColumn> = {
  mock: 'golfireland_account',
  golf_ireland: 'golfireland_account',
  brs: 'brs_account',
  clubv1: 'clubv1_account',
};

function getMembershipRequestStepColumn(
  adapterName: string | null | undefined
): MembershipRequestStepColumn | undefined {
  if (!adapterName) {
    return undefined;
  }

  return MEMBERSHIP_REQUEST_STEP_COLUMN_BY_ADAPTER[adapterName];
}

function buildMembershipRequestOutcomeUpdate(
  adapterName: string | null | undefined,
  stepStatus: 'completed' | 'failed',
  options: {
    didStepStart?: boolean;
    updates?: MembershipRequestUpdate;
  } = {}
): MembershipRequestUpdate {
  const update: MembershipRequestUpdate = {
    status: stepStatus === 'failed' ? 'failed' : 'pending',
    ...(options.updates ?? {}),
  };

  if (stepStatus === 'failed' && options.didStepStart === false) {
    return update;
  }

  const stepColumn = getMembershipRequestStepColumn(adapterName);

  if (!stepColumn) {
    return update;
  }

  update[stepColumn] = stepStatus;

  return update;
}

function createQueueEntryProcessingFailure(
  error: unknown,
  context: QueueEntryProcessingFailureContext
): Error & { context: QueueEntryProcessingFailureContext } {
  const normalizedError = error instanceof Error ? error : new Error(getErrorMessage(error));

  return Object.assign(normalizedError, { context });
}

function getQueueEntryProcessingFailureContext(
  error: unknown
): QueueEntryProcessingFailureContext | null {
  if (!error || typeof error !== 'object' || !('context' in error)) {
    return null;
  }

  const context = (error as { context?: QueueEntryProcessingFailureContext }).context;

  if (!context) {
    return null;
  }

  return context;
}

// ============================================================
// Structured Logger
// ============================================================

class StructuredLogger implements IntegrationLogger {
  private write(
    level: 'info' | 'warn' | 'error',
    entry: LogEntry,
    data: JsonObject | undefined,
    sink: typeof console.log
  ): void {
    const base = {
      log_level: level,
      timestamp: new Date().toISOString(),
    };

    const payload =
      typeof entry === 'string'
        ? {
            ...base,
            message: entry,
            ...data,
          }
        : {
            ...base,
            ...entry,
            ...data,
          };

    sink(JSON.stringify(payload));
  }

  info(entry: LogEntry, data?: JsonObject): void {
    this.write('info', entry, data, console.log);
  }

  warn(entry: LogEntry, data?: JsonObject): void {
    this.write('warn', entry, data, console.warn);
  }

  error(entry: LogEntry, data?: JsonObject): void {
    this.write('error', entry, data, console.error);
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
    ...buildWorkerLog({
      event_type: 'processing_succeeded',
      adapter_name: adapterName,
      external_id: externalId,
    }),
    request_id: requestId,
  });

  await updateMembershipRequest(
    requestId,
    buildMembershipRequestOutcomeUpdate(adapterName, 'completed', {
      updates: {
        external_id: externalId,
      },
    })
  );

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
  adapterName: string | null,
  error: string,
  screenshotPath: string | undefined,
  didStepStart: boolean,
  logger: IntegrationLogger
): Promise<void> {
  const supabase = createServiceRoleClient();

  const errorLog: JsonObject = {
    ...buildWorkerLog({
      event_type: 'processing_failed',
      adapter_name: adapterName,
      error_message: error,
      screenshot_path: screenshotPath ?? null,
    }),
    request_id: requestId,
  };

  logger.error('processing_failed', errorLog);

  await updateMembershipRequest(
    requestId,
    buildMembershipRequestOutcomeUpdate(adapterName, 'failed', {
      didStepStart,
    })
  );

  const failureUpdate: Record<string, string> = {
    status: 'failed',
    last_error: error,
    last_error_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (screenshotPath) {
    failureUpdate.screenshot_path = screenshotPath;
  }

  let { error: queueError } = await supabase
    .from('integration_queue')
    .update(failureUpdate)
    .eq('id', queueEntryId);

  if (queueError && screenshotPath && isMissingScreenshotPathColumn(queueError.message)) {
    logger.warn(
      'failure_screenshot_persistence_unavailable',
      buildWorkerLog({
        event_type: 'failure_screenshot_persistence_unavailable',
        adapter_name: adapterName,
        error_message: queueError.message,
        screenshot_path: screenshotPath,
      })
    );

    ({ error: queueError } = await supabase
      .from('integration_queue')
      .update({
        status: 'failed',
        last_error: error,
        last_error_at: failureUpdate.last_error_at,
        updated_at: failureUpdate.updated_at,
      })
      .eq('id', queueEntryId));
  }

  if (queueError) {
    throw new Error(`Failed to update queue entry: ${queueError.message}`);
  }
}

function trackInFlightQueueEntry(
  queueEntryId: string,
  requestId: string,
  adapterName: string | null
): void {
  inFlightQueueEntries.set(queueEntryId, {
    queueEntryId,
    requestId,
    adapterName,
    didStepStart: false,
    stepOutcomePersisted: false,
  });
}

function updateInFlightQueueEntry(
  queueEntryId: string,
  updates: Partial<Pick<InFlightQueueEntryState, 'adapterName' | 'didStepStart' | 'stepOutcomePersisted'>>
): void {
  const entry = inFlightQueueEntries.get(queueEntryId);

  if (!entry) {
    return;
  }

  inFlightQueueEntries.set(queueEntryId, {
    ...entry,
    ...updates,
  });
}

async function forceQueueEntryFailure(
  queueEntryId: string,
  requestId: string,
  adapterName: string | null,
  error: string,
  didStepStart: boolean,
  logger: IntegrationLogger
): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    await updateMembershipRequest(
      requestId,
      buildMembershipRequestOutcomeUpdate(adapterName, 'failed', {
        didStepStart,
      })
    );
  } catch (membershipError) {
    logger.error('queue_processing_force_failure_membership_error', {
      ...buildWorkerLog({
        event_type: 'queue_processing_force_failure_membership_error',
        adapter_name: adapterName,
        error_message: getErrorMessage(membershipError),
      }),
      queue_id: queueEntryId,
      request_id: requestId,
    });
  }

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
    logger.error('queue_processing_force_failure_queue_error', {
      ...buildWorkerLog({
        event_type: 'queue_processing_force_failure_queue_error',
        adapter_name: adapterName,
        error_message: queueError.message,
      }),
      queue_id: queueEntryId,
      request_id: requestId,
    });
  }
}

async function finalizeInFlightQueueEntries(
  errorMessage: string,
  logger: IntegrationLogger,
  eventType: 'fatal_runtime_in_flight_finalization' | 'shutdown_in_flight_finalization'
): Promise<void> {
  if (inFlightFinalizationPromise) {
    await inFlightFinalizationPromise;
    return;
  }

  const unfinishedEntries = Array.from(inFlightQueueEntries.values()).filter(
    (entry) => !entry.stepOutcomePersisted
  );

  if (unfinishedEntries.length === 0) {
    return;
  }

  logger.warn(eventType, {
    ...buildWorkerLog({
      event_type: eventType,
      error_message: errorMessage,
    }),
    in_flight_count: unfinishedEntries.length,
  });

  inFlightFinalizationPromise = Promise.all(
    unfinishedEntries.map(async (entry) => {
      try {
        await handleFailure(
          entry.queueEntryId,
          entry.requestId,
          entry.adapterName,
          errorMessage,
          undefined,
          entry.didStepStart,
          logger
        );
        updateInFlightQueueEntry(entry.queueEntryId, { stepOutcomePersisted: true });
      } catch (error) {
        logger.error('in_flight_finalization_failed', {
          ...buildWorkerLog({
            event_type: 'in_flight_finalization_failed',
            adapter_name: entry.adapterName,
            error_message: getErrorMessage(error),
          }),
          queue_id: entry.queueEntryId,
          request_id: entry.requestId,
        });
      } finally {
        inFlightQueueEntries.delete(entry.queueEntryId);
      }
    })
  )
    .then(() => undefined)
    .finally(() => {
      inFlightFinalizationPromise = null;
    });

  await inFlightFinalizationPromise;
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
  let adapterName: string | null = null;

  trackInFlightQueueEntry(queueEntryId, requestId, adapterName);

  let didStepStart = false;
  let stepOutcomePersisted = false;

  try {
    adapterName = resolveAdapterNameForRequestType(requestType);
    updateInFlightQueueEntry(queueEntryId, { adapterName });

    logger.info('queue_entry_received', {
      ...buildWorkerLog({
        event_type: 'queue_entry_received',
        adapter_name: adapterName,
      }),
      queue_id: queueEntryId,
      request_id: requestId,
      request_type: requestType,
    });

    // Instantiate adapter
    logger.info('adapter_instantiation_started', {
      ...buildWorkerLog({
        event_type: 'adapter_instantiation_started',
        adapter_name: adapterName,
      }),
      request_id: requestId,
      request_type: requestType,
    });

    const adapter = createAdapterByName(adapterName);

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
      ...buildWorkerLog({
        event_type: 'adapter_execution_started',
        adapter_name: adapterName,
      }),
      request_id: requestId,
      request_type: requestType,
    });

    didStepStart = true;
    updateInFlightQueueEntry(queueEntryId, { didStepStart: true });
    const response = await adapter.execute(request, context);

    // Handle response
    if (response.success && response.externalId) {
      await handleSuccess(queueEntryId, requestId, adapterName, response.externalId, logger);
      stepOutcomePersisted = true;
      updateInFlightQueueEntry(queueEntryId, { stepOutcomePersisted: true });
    } else {
      const errorMessage = response.error || 'Unknown error';
      await handleFailure(
        queueEntryId,
        requestId,
        adapterName,
        errorMessage,
        response.screenshotPath,
        didStepStart,
        logger
      );
      stepOutcomePersisted = true;
      updateInFlightQueueEntry(queueEntryId, { stepOutcomePersisted: true });
    }

    // Optional cleanup
    if (adapter.cleanup) {
      await adapter.cleanup(context);
    }
  } catch (error) {
    if (stepOutcomePersisted) {
      throw createQueueEntryProcessingFailure(error, {
        queueEntryId,
        requestId,
        adapterName,
        didStepStart,
        stepOutcomePersisted,
      });
    }

    try {
      await handleFailure(
        queueEntryId,
        requestId,
        adapterName,
        getErrorMessage(error),
        getScreenshotPathFromError(error),
        didStepStart,
        logger
      );
      stepOutcomePersisted = true;
      updateInFlightQueueEntry(queueEntryId, { stepOutcomePersisted: true });
    } catch (failureError) {
      throw createQueueEntryProcessingFailure(failureError, {
        queueEntryId,
        requestId,
        adapterName,
        didStepStart,
        stepOutcomePersisted: false,
      });
    }
  } finally {
    inFlightQueueEntries.delete(queueEntryId);
  }
}

async function processQueueBatch(
  workerId: string,
  logger: IntegrationLogger,
  batchSize = 10
): Promise<number> {
  const queueEntries = await dequeue(workerId, batchSize);

  if (queueEntries.length === 0) {
    return 0;
  }

  const promises = queueEntries.map((entry) => {
    inFlightCount++;
    return processQueueEntry(entry, workerId, logger)
      .catch(async (error) => {
        const failureContext = getQueueEntryProcessingFailureContext(error);

        logger.error('queue_processing_error', {
          ...buildWorkerLog({
            event_type: 'queue_processing_error',
            adapter_name: failureContext?.adapterName ?? null,
            error_message: getErrorMessage(error),
          }),
          queue_id: entry.id,
          request_id: entry.requestId,
        });

        if (failureContext && !failureContext.stepOutcomePersisted) {
          await forceQueueEntryFailure(
            failureContext.queueEntryId,
            failureContext.requestId,
            failureContext.adapterName,
            getErrorMessage(error),
            failureContext.didStepStart,
            logger
          );
        }
      })
      .finally(() => {
        inFlightCount--;
      });
  });

  await Promise.all(promises);

  return queueEntries.length;
}

// ============================================================
// Worker Main Loop
// ============================================================

let isShuttingDown = false;
let inFlightCount = 0;
let inFlightQueueEntries = new Map<string, InFlightQueueEntryState>();
let inFlightFinalizationPromise: Promise<void> | null = null;

async function runWorker(): Promise<void> {
  const logger = new StructuredLogger();

  const workerId = process.env.INTEGRATION_WORKER_ID || DEFAULT_WORKER_ID();
  const pollIntervalMs = parseInt(process.env.INTEGRATION_QUEUE_POLL_INTERVAL_MS || '', 10) || DEFAULT_POLL_INTERVAL_MS;
  const batchSize = 10;

  logger.info('worker_polling_started', {
    ...buildWorkerLog({
      event_type: 'worker_polling_started',
    }),
    worker_id: workerId,
    poll_interval_ms: pollIntervalMs,
  });

  // Main polling loop
  while (!isShuttingDown) {
    try {
      const processedCount = await processQueueBatch(workerId, logger, batchSize);

      if (processedCount === 0) {
        // No items available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        continue;
      }

      // Yield briefly before next poll
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('polling_error', {
        ...buildWorkerLog({
          event_type: 'polling_error',
          error_message: getErrorMessage(error),
        }),
      });
      // Wait before retrying on error
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  logger.info('worker_polling_stopped', {
    ...buildWorkerLog({
      event_type: 'worker_polling_stopped',
    }),
    worker_id: workerId,
  });
}

// ============================================================
// Graceful Shutdown
// ============================================================

async function setupGracefulShutdown(logger: IntegrationLogger): Promise<void> {
  const handleShutdown = async (signal: string) => {
    logger.info('graceful_shutdown_initiated', {
      ...buildWorkerLog({
        event_type: 'graceful_shutdown_initiated',
      }),
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
        ...buildWorkerLog({
          event_type: 'graceful_shutdown_timeout',
        }),
        in_flight_count: inFlightCount,
      });

      await finalizeInFlightQueueEntries(
        SHUTDOWN_FAILURE_MESSAGE,
        logger,
        'shutdown_in_flight_finalization'
      );
    }

    logger.info('graceful_shutdown_complete', {
      ...buildWorkerLog({
        event_type: 'graceful_shutdown_complete',
      }),
    });

    process.exit(0);
  };

  const handleFatalRuntimeError = async (
    eventType: 'uncaughtException' | 'unhandledRejection',
    error: unknown
  ) => {
    logger.error('worker_runtime_fatal', {
      ...buildWorkerLog({
        event_type: 'worker_runtime_fatal',
        error_message: getErrorMessage(error),
      }),
      runtime_event: eventType,
      in_flight_count: inFlightCount,
    });

    isShuttingDown = true;

    await finalizeInFlightQueueEntries(
      FATAL_RUNTIME_FAILURE_MESSAGE,
      logger,
      'fatal_runtime_in_flight_finalization'
    );

    process.exit(1);
  };

  process.on('SIGTERM', async () => handleShutdown('SIGTERM'));
  process.on('SIGINT', async () => handleShutdown('SIGINT'));
  process.on('uncaughtException', async (error) => handleFatalRuntimeError('uncaughtException', error));
  process.on('unhandledRejection', async (reason) => handleFatalRuntimeError('unhandledRejection', reason));
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
      ...buildWorkerLog({
        event_type: 'worker_startup_error',
        error_message: getErrorMessage(error),
      }),
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

function resetWorkerStateForTests(): void {
  isShuttingDown = false;
  inFlightCount = 0;
  inFlightQueueEntries = new Map();
  inFlightFinalizationPromise = null;
}

export { processQueueBatch, processQueueEntry, resetWorkerStateForTests, runWorker, StructuredLogger, setupGracefulShutdown };
