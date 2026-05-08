import { MockAdapter } from '@/lib/integrations/mock';
import type { IntegrationAdapter } from '@/lib/integrations/types';
import * as updateMembershipRequestModule from '@/lib/actions/updateMembershipRequest';
import * as dequeueModule from '@/lib/queue/dequeue';
import * as factoryModule from '@/lib/integrations/factory';
import * as supabaseModule from '@/lib/supabase/server';
import {
  processQueueBatch,
  resetWorkerStateForTests,
  runWorker,
  setupGracefulShutdown,
  StructuredLogger,
} from '@/lib/worker';
import type { DequeuedIntegrationQueueItem } from '@/lib/queue/dequeue';

jest.mock('@/lib/actions/updateMembershipRequest');
jest.mock('@/lib/queue/dequeue');
jest.mock('@/lib/integrations/factory');
jest.mock('@/lib/supabase/server');

type QueueUpdateCall = {
  table: string;
  values: Record<string, unknown>;
  id: string;
};

const FATAL_RUNTIME_FAILURE_MESSAGE =
  'Worker runtime failed before the job completed; marked failed as abandoned.';
const SHUTDOWN_FAILURE_MESSAGE =
  'Worker shutdown before the job completed; marked failed as abandoned.';

const queueEntry: DequeuedIntegrationQueueItem = {
  id: 'queue-1',
  requestId: 'request-1',
  status: 'processing',
  lastError: null,
  lastErrorAt: null,
  lockedAt: '2026-05-08T10:00:00.000Z',
  lockedByWorker: 'test-worker-1',
  metadata: null,
  createdAt: '2026-05-08T10:00:00.000Z',
  updatedAt: '2026-05-08T10:00:00.000Z',
  requestType: 'Full Member',
  payload: {
    test: 'data',
  },
};

function createSupabaseMock(queueUpdateCalls: QueueUpdateCall[]) {
  return {
    from: jest.fn((table: string) => ({
      update: jest.fn((values: Record<string, unknown>) => ({
        eq: jest.fn(async (_column: string, id: string) => {
          queueUpdateCalls.push({ table, values, id });
          return { error: null };
        }),
      })),
    })),
  };
}

function getLoggedEntries(spy: jest.SpyInstance): Record<string, unknown>[] {
  return spy.mock.calls.map(([entry]) => JSON.parse(entry));
}

describe('Background Worker Service (PBI-042)', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockDequeue: jest.MockedFunction<typeof dequeueModule.dequeue>;
  let mockCreateAdapterByName: jest.MockedFunction<typeof factoryModule.createAdapterByName>;
  let mockResolveAdapterNameForRequestType: jest.MockedFunction<
    typeof factoryModule.resolveAdapterNameForRequestType
  >;
  let mockCreateServiceRoleClient: jest.MockedFunction<typeof supabaseModule.createServiceRoleClient>;
  let mockUpdateMembershipRequest: jest.MockedFunction<
    typeof updateMembershipRequestModule.updateMembershipRequest
  >;
  let queueUpdateCalls: QueueUpdateCall[];

  beforeEach(() => {
    jest.clearAllMocks();
    resetWorkerStateForTests();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    queueUpdateCalls = [];

    mockDequeue = dequeueModule.dequeue as jest.MockedFunction<typeof dequeueModule.dequeue>;
    mockCreateAdapterByName =
      factoryModule.createAdapterByName as jest.MockedFunction<typeof factoryModule.createAdapterByName>;
    mockResolveAdapterNameForRequestType =
      factoryModule.resolveAdapterNameForRequestType as jest.MockedFunction<
        typeof factoryModule.resolveAdapterNameForRequestType
      >;
    mockCreateServiceRoleClient =
      supabaseModule.createServiceRoleClient as jest.MockedFunction<typeof supabaseModule.createServiceRoleClient>;
    mockUpdateMembershipRequest =
      updateMembershipRequestModule.updateMembershipRequest as jest.MockedFunction<
        typeof updateMembershipRequestModule.updateMembershipRequest
      >;

    mockCreateServiceRoleClient.mockReturnValue(
      createSupabaseMock(queueUpdateCalls) as unknown as ReturnType<
        typeof supabaseModule.createServiceRoleClient
      >
    );
    mockResolveAdapterNameForRequestType.mockReturnValue('mock');
    mockUpdateMembershipRequest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetWorkerStateForTests();
    jest.useRealTimers();

    delete process.env.INTEGRATION_QUEUE_POLL_INTERVAL_MS;
    delete process.env.INTEGRATION_WORKER_ID;

    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('logs string entries as structured JSON', () => {
    const logger = new StructuredLogger();

    logger.info('test message', { request_id: 'request-1' });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0])).toMatchObject({
      log_level: 'info',
      message: 'test message',
      request_id: 'request-1',
    });
  });

  it('logs object entries as structured JSON', () => {
    const logger = new StructuredLogger();

    logger.info({ event_type: 'form_fill_in_progress', request_id: 'request-1' });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0])).toMatchObject({
      log_level: 'info',
      event_type: 'form_fill_in_progress',
      request_id: 'request-1',
    });
  });

  it('runs the dequeue-to-complete path and persists external_id', async () => {
    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(new MockAdapter());

    const processedCount = await processQueueBatch('test-worker-1', new StructuredLogger(), 10);

    expect(processedCount).toBe(1);
    expect(mockDequeue).toHaveBeenCalledWith('test-worker-1', 10);
    expect(mockResolveAdapterNameForRequestType).toHaveBeenCalledWith('Full Member');
    expect(mockCreateAdapterByName).toHaveBeenCalledWith('mock');
    expect(mockUpdateMembershipRequest).toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({
        external_id: expect.stringMatching(/^mock-\d+$/),
        golfireland_account: 'completed',
        status: 'pending',
      })
    );
    expect(queueUpdateCalls).toContainEqual(
      expect.objectContaining({
        table: 'integration_queue',
        id: 'queue-1',
        values: expect.objectContaining({ status: 'completed' }),
      })
    );

    const infoLogs = getLoggedEntries(consoleLogSpy);
    const loggedEvents = infoLogs.map((entry) => entry.event_type).filter(Boolean);
    expect(loggedEvents).toContain('form_fill_in_progress');
    expect(loggedEvents).toContain('form_submission_attempted');

    expect(infoLogs).toContainEqual(
      expect.objectContaining({
        event_type: 'adapter_execution_completed',
        adapter_name: 'mock',
        external_id: expect.stringMatching(/^mock-\d+$/),
        error_message: null,
        screenshot_path: null,
        log_level: 'info',
      })
    );
    expect(infoLogs).toContainEqual(
      expect.objectContaining({
        event_type: 'adapter_cleanup_completed',
        adapter_name: 'mock',
        external_id: null,
        error_message: null,
        screenshot_path: null,
        log_level: 'info',
      })
    );
  });

  it('marks the queue entry as failed when the adapter returns a failed response', async () => {
    const failingAdapter: IntegrationAdapter = {
      name: 'mock',
      validate: jest.fn(),
      execute: jest.fn().mockResolvedValue({
        success: false,
        error: 'Form submission rejected',
        screenshotPath: '/tmp/form-submission.png',
      }),
    };

    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(failingAdapter);

    const processedCount = await processQueueBatch('test-worker-1', new StructuredLogger(), 10);

    expect(processedCount).toBe(1);
    expect(mockUpdateMembershipRequest).toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({
        golfireland_account: 'failed',
        status: 'failed',
      })
    );
    expect(queueUpdateCalls).toContainEqual(
      expect.objectContaining({
        table: 'integration_queue',
        id: 'queue-1',
        values: expect.objectContaining({
          status: 'failed',
          last_error: 'Form submission rejected',
          screenshot_path: '/tmp/form-submission.png',
        }),
      })
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(JSON.parse(consoleErrorSpy.mock.calls[0][0])).toMatchObject({
      event_type: 'processing_failed',
      log_level: 'error',
      screenshot_path: '/tmp/form-submission.png',
    });
  });

  it('marks the queue entry as failed when adapter execution throws', async () => {
    const throwingAdapter: IntegrationAdapter = {
      name: 'mock',
      validate: jest.fn(),
      execute: jest.fn().mockRejectedValue(new Error('Unexpected adapter error')),
    };

    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(throwingAdapter);

    const processedCount = await processQueueBatch('test-worker-1', new StructuredLogger(), 10);

    expect(processedCount).toBe(1);
    expect(mockUpdateMembershipRequest).toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({
        golfireland_account: 'failed',
        status: 'failed',
      })
    );
    expect(queueUpdateCalls).toContainEqual(
      expect.objectContaining({
        table: 'integration_queue',
        id: 'queue-1',
        values: expect.objectContaining({
          status: 'failed',
          last_error: 'Unexpected adapter error',
        }),
      })
    );
  });

  it('logs queue_processing_error with the resolved adapter name when failure persistence throws', async () => {
    const persistenceError = { message: 'integration_queue update failed' };
    const failingAdapter: IntegrationAdapter = {
      name: 'mock',
      validate: jest.fn(),
      execute: jest.fn().mockResolvedValue({
        success: false,
        error: 'Form submission rejected',
      }),
    };

    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(failingAdapter);
    mockCreateServiceRoleClient.mockReturnValue({
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(async () => ({ error: persistenceError })),
        })),
      })),
    } as unknown as ReturnType<typeof supabaseModule.createServiceRoleClient>);

    const processedCount = await processQueueBatch('test-worker-1', new StructuredLogger(), 10);

    expect(processedCount).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalled();

    const errorLogs = getLoggedEntries(consoleErrorSpy);
    expect(errorLogs).toContainEqual(
      expect.objectContaining({
        event_type: 'queue_processing_error',
        adapter_name: 'mock',
        error_message: 'Failed to update queue entry: integration_queue update failed',
        log_level: 'error',
      })
    );
  });

  it('marks the request as failed without failing step 1 when execution never starts', async () => {
    const invalidAdapter: IntegrationAdapter = {
      name: 'mock',
      validate: jest.fn(() => {
        throw new Error('Adapter validation failed');
      }),
      execute: jest.fn(),
    };

    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(invalidAdapter);

    const processedCount = await processQueueBatch('test-worker-1', new StructuredLogger(), 10);

    expect(processedCount).toBe(1);
    expect(invalidAdapter.execute).not.toHaveBeenCalled();
    expect(mockUpdateMembershipRequest).toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({
        status: 'failed',
      })
    );
    expect(mockUpdateMembershipRequest).not.toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({
        golfireland_account: 'failed',
      })
    );
    expect(queueUpdateCalls).toContainEqual(
      expect.objectContaining({
        table: 'integration_queue',
        id: 'queue-1',
        values: expect.objectContaining({
          status: 'failed',
          last_error: 'Adapter validation failed',
        }),
      })
    );
  });

  it('returns zero when no queue items are available', async () => {
    mockDequeue.mockResolvedValueOnce([]);

    const processedCount = await processQueueBatch('test-worker-1', new StructuredLogger(), 10);

    expect(processedCount).toBe(0);
    expect(mockCreateAdapterByName).not.toHaveBeenCalled();
    expect(mockUpdateMembershipRequest).not.toHaveBeenCalled();
    expect(queueUpdateCalls).toEqual([]);
  });

  it('polls again after the configured interval and stops on graceful shutdown', async () => {
    jest.useFakeTimers();

    const signalHandlers: Partial<Record<'SIGINT' | 'SIGTERM', () => void | Promise<void>>> = {};
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation(
      ((event: NodeJS.Signals, handler: () => void | Promise<void>) => {
        if (event === 'SIGTERM' || event === 'SIGINT') {
          signalHandlers[event] = handler;
        }

        return process;
      }) as typeof process.on
    );
    const processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    process.env.INTEGRATION_QUEUE_POLL_INTERVAL_MS = '250';
    process.env.INTEGRATION_WORKER_ID = 'test-worker-1';
    mockDequeue.mockResolvedValue([]);

    await setupGracefulShutdown(new StructuredLogger());

    const workerPromise = runWorker();
    await Promise.resolve();

    expect(mockDequeue).toHaveBeenCalledTimes(1);
    expect(mockDequeue).toHaveBeenNthCalledWith(1, 'test-worker-1', 10);

    await jest.advanceTimersByTimeAsync(250);

    expect(mockDequeue).toHaveBeenCalledTimes(2);
    expect(mockDequeue).toHaveBeenNthCalledWith(2, 'test-worker-1', 10);

    await signalHandlers.SIGTERM?.();
    await jest.advanceTimersByTimeAsync(250);
    await workerPromise;

    expect(processExitSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy.mock.calls.map(([entry]) => JSON.parse(entry).event_type)).toEqual(
      expect.arrayContaining([
        'worker_polling_started',
        'graceful_shutdown_initiated',
        'graceful_shutdown_complete',
        'worker_polling_stopped',
      ])
    );

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('waits for in-flight work to complete before exiting during graceful shutdown', async () => {
    jest.useFakeTimers();

    let resolveExecution: ((value: { success: true; externalId: string }) => void) | undefined;
    const signalHandlers: Partial<Record<'SIGINT' | 'SIGTERM', () => void | Promise<void>>> = {};
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation(
      ((event: NodeJS.Signals, handler: () => void | Promise<void>) => {
        if (event === 'SIGTERM' || event === 'SIGINT') {
          signalHandlers[event] = handler;
        }

        return process;
      }) as typeof process.on
    );
    const processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    const slowAdapter: IntegrationAdapter = {
      name: 'mock',
      validate: jest.fn(),
      execute: jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveExecution = resolve;
          })
      ),
    };

    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(slowAdapter);

    await setupGracefulShutdown(new StructuredLogger());

    const batchPromise = processQueueBatch('test-worker-1', new StructuredLogger(), 10);
    await Promise.resolve();

    const shutdownPromise = signalHandlers.SIGTERM?.();
    await Promise.resolve();

    expect(processExitSpy).not.toHaveBeenCalled();

    resolveExecution?.({ success: true, externalId: 'mock-42' });
    await batchPromise;
    await jest.advanceTimersByTimeAsync(1000);
    await shutdownPromise;

    expect(processExitSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy.mock.calls.map(([entry]) => JSON.parse(entry).event_type)).toEqual(
      expect.arrayContaining(['graceful_shutdown_initiated', 'graceful_shutdown_complete'])
    );

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('validates mock adapter payload requirements', () => {
    const adapter = new MockAdapter();

    expect(() =>
      adapter.validate({
        id: 'queue-1',
        request_type: 'mock',
        payload: { valid: true },
        request_id: 'request-1',
      })
    ).not.toThrow();
    expect(() =>
      adapter.validate({
        id: 'queue-1',
        request_type: 'mock',
        payload: null as never,
        request_id: 'request-1',
      })
    ).toThrow('payload is required and must be an object');
  });

  it('best-effort finalizes unfinished claimed entries on fatal runtime failure', async () => {
    const runtimeHandlers: Partial<
      Record<'uncaughtException' | 'unhandledRejection', (...args: unknown[]) => void | Promise<void>>
    > = {};
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation(
      ((event: 'SIGINT' | 'SIGTERM' | 'uncaughtException' | 'unhandledRejection', handler: (...args: unknown[]) => void | Promise<void>) => {
        if (event === 'uncaughtException' || event === 'unhandledRejection') {
          runtimeHandlers[event] = handler;
        }

        return process;
      }) as typeof process.on
    );
    const processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    const hangingAdapter: IntegrationAdapter = {
      name: 'mock',
      validate: jest.fn(),
      execute: jest.fn(() => new Promise(() => undefined)),
    };

    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(hangingAdapter);

    await setupGracefulShutdown(new StructuredLogger());

    void processQueueBatch('test-worker-1', new StructuredLogger(), 10);
    await Promise.resolve();
    await Promise.resolve();

    await runtimeHandlers.unhandledRejection?.(new Error('fatal worker rejection'));

    expect(mockUpdateMembershipRequest).toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({
        golfireland_account: 'failed',
        status: 'failed',
      })
    );
    expect(queueUpdateCalls).toContainEqual(
      expect.objectContaining({
        table: 'integration_queue',
        id: 'queue-1',
        values: expect.objectContaining({
          status: 'failed',
          last_error: FATAL_RUNTIME_FAILURE_MESSAGE,
        }),
      })
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('best-effort finalizes unfinished claimed entries during shutdown timeout', async () => {
    jest.useFakeTimers();

    const signalHandlers: Partial<
      Record<'SIGINT' | 'SIGTERM', (...args: unknown[]) => void | Promise<void>>
    > = {};
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation(
      ((event: 'SIGINT' | 'SIGTERM' | 'uncaughtException' | 'unhandledRejection', handler: (...args: unknown[]) => void | Promise<void>) => {
        if (event === 'SIGTERM' || event === 'SIGINT') {
          signalHandlers[event] = handler;
        }

        return process;
      }) as typeof process.on
    );
    const processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    const hangingAdapter: IntegrationAdapter = {
      name: 'mock',
      validate: jest.fn(),
      execute: jest.fn(() => new Promise(() => undefined)),
    };

    mockDequeue.mockResolvedValueOnce([queueEntry]);
    mockCreateAdapterByName.mockReturnValue(hangingAdapter);

    await setupGracefulShutdown(new StructuredLogger());

    void processQueueBatch('test-worker-1', new StructuredLogger(), 10);
    await Promise.resolve();
    await Promise.resolve();

    const shutdownPromise = signalHandlers.SIGTERM?.();
    await jest.advanceTimersByTimeAsync(30000);
    await shutdownPromise;

    expect(mockUpdateMembershipRequest).toHaveBeenCalledWith(
      'request-1',
      expect.objectContaining({
        golfireland_account: 'failed',
        status: 'failed',
      })
    );
    expect(queueUpdateCalls).toContainEqual(
      expect.objectContaining({
        table: 'integration_queue',
        id: 'queue-1',
        values: expect.objectContaining({
          status: 'failed',
          last_error: SHUTDOWN_FAILURE_MESSAGE,
        }),
      })
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);

    processOnSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});

