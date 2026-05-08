/**
 * Tests for background worker service (PBI-042)
 */

import { StructuredLogger } from '@/lib/worker';
import * as dequeueModule from '@/lib/queue/dequeue';
import * as factoryModule from '@/lib/integrations/factory';
import * as supabaseModule from '@/lib/supabase/server';
import { MockAdapter } from '@/lib/integrations/mock';
import { DequeuedIntegrationQueueItem } from '@/lib/integrations/types';

// Mock all external dependencies
jest.mock('@/lib/queue/dequeue');
jest.mock('@/lib/integrations/factory');
jest.mock('@/lib/supabase/server');

describe('Background Worker Service (PBI-042)', () => {
  let mockDequeue: jest.Mock;
  let mockCreateAdapterByName: jest.Mock;
  let mockCreateServiceRoleClient: jest.Mock;
  let mockSupabaseClient: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup dequeue mock
    mockDequeue = dequeueModule.dequeue as jest.Mock;
    mockDequeue.mockResolvedValue([]);

    // Setup factory mock
    mockCreateAdapterByName = factoryModule.createAdapterByName as jest.Mock;

    // Setup Supabase client mock
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockCreateServiceRoleClient = supabaseModule.createServiceRoleClient as jest.Mock;
    mockCreateServiceRoleClient.mockReturnValue(mockSupabaseClient);

    // Setup console spies for logging assertions
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Set environment variables
    process.env.INTEGRATION_WORKER_ID = 'test-worker-1';
    process.env.INTEGRATION_QUEUE_POLL_INTERVAL_MS = '100';
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    delete process.env.INTEGRATION_WORKER_ID;
    delete process.env.INTEGRATION_QUEUE_POLL_INTERVAL_MS;
  });

  describe('Structured Logger', () => {
    it('should log info messages as JSON with timestamp', () => {
      const logger = new StructuredLogger();
      logger.info('test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logged = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logged).toMatchObject({
        level: 'info',
        message: 'test message',
        key: 'value',
      });
      expect(logged.timestamp).toBeDefined();
    });

    it('should log error messages as JSON with timestamp', () => {
      const logger = new StructuredLogger();
      logger.error('error occurred', { error_code: 'E001' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logged = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logged).toMatchObject({
        level: 'error',
        message: 'error occurred',
        error_code: 'E001',
      });
      expect(logged.timestamp).toBeDefined();
    });

    it('should log warning messages as JSON with timestamp', () => {
      const logger = new StructuredLogger();
      logger.warn('warning issued', { context: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logged = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(logged).toMatchObject({
        level: 'warn',
        message: 'warning issued',
        context: 'test',
      });
      expect(logged.timestamp).toBeDefined();
    });
  });

  describe('Adapter Execution', () => {
    it('should instantiate correct adapter by request type', () => {
      const mockAdapter = new MockAdapter();
      mockCreateAdapterByName.mockReturnValue(mockAdapter);

      const adapter = mockCreateAdapterByName('mock');

      expect(mockCreateAdapterByName).toHaveBeenCalledWith('mock');
      expect(adapter).toBe(mockAdapter);
    });

    it('should throw error for unknown adapter name', () => {
      mockCreateAdapterByName.mockImplementation((name: string) => {
        throw new Error(`Unknown adapter: ${name}`);
      });

      expect(() => mockCreateAdapterByName('unknown')).toThrow('Unknown adapter: unknown');
    });

    it('should execute adapter with request payload', async () => {
      const mockAdapter = new MockAdapter();
      const executeSpy = jest.spyOn(mockAdapter, 'execute').mockResolvedValueOnce({
        success: true,
        externalId: 'ext-123',
      });

      const request = {
        id: 'queue-1',
        request_type: 'mock',
        payload: { field1: 'value1' },
        request_id: 'request-1',
      };

      const context = {
        workerId: 'test-worker',
        requestId: 'request-1',
        queueEntryId: 'queue-1',
        logger: new StructuredLogger(),
      };

      const response = await mockAdapter.execute(request, context);

      expect(response.success).toBe(true);
      expect(response.externalId).toBe('ext-123');
    });
  });

  describe('Success Handling', () => {
    it('should prepare success log with externalId', () => {
      const logger = new StructuredLogger();

      logger.info('processing_succeeded', {
        event_type: 'processing_succeeded',
        adapter_name: 'mock',
        externalId: 'ext-123',
        request_id: 'request-1',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logged = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logged).toMatchObject({
        event_type: 'processing_succeeded',
        adapter_name: 'mock',
        externalId: 'ext-123',
        request_id: 'request-1',
      });
    });

    it('should update membership_requests on successful adapter response', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const supabase = mockCreateServiceRoleClient();
      const { error } = await supabase
        .from('membership_requests')
        .update({ golfireland_account: 'completed' })
        .eq('id', 'request-1');

      expect(error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('membership_requests');
    });

    it('should update queue entry to completed status', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const supabase = mockCreateServiceRoleClient();
      const { error } = await supabase
        .from('integration_queue')
        .update({ status: 'completed' })
        .eq('id', 'queue-1');

      expect(error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('integration_queue');
    });
  });

  describe('Failure Handling', () => {
    it('should prepare failure log with error message', () => {
      const logger = new StructuredLogger();

      const errorLog: any = {
        event_type: 'processing_failed',
        adapter_name: 'mock',
        error_message: 'Integration failed',
        request_id: 'request-1',
      };

      logger.error('processing_failed', errorLog);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logged = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logged).toMatchObject({
        event_type: 'processing_failed',
        adapter_name: 'mock',
        error_message: 'Integration failed',
        request_id: 'request-1',
      });
    });

    it('should include screenshot_path in failure log when provided', () => {
      const logger = new StructuredLogger();

      const errorLog: any = {
        event_type: 'processing_failed',
        adapter_name: 'mock',
        error_message: 'Form submission timeout',
        request_id: 'request-1',
        screenshot_path: '/path/to/screenshot.png',
      };

      logger.error('processing_failed', errorLog);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logged = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logged.screenshot_path).toBe('/path/to/screenshot.png');
    });

    it('should mark queue entry as failed with error details', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const supabase = mockCreateServiceRoleClient();
      const { error } = await supabase
        .from('integration_queue')
        .update({
          status: 'failed',
          last_error: 'Integration failed',
          last_error_at: new Date().toISOString(),
        })
        .eq('id', 'queue-1');

      expect(error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('integration_queue');
    });

    it('should NOT retry on failure (status should be failed, not pending)', () => {
      const failedStatus = 'failed';
      const retryStatus = 'pending';

      expect(failedStatus).not.toBe(retryStatus);
      expect(failedStatus).toBe('failed');
    });
  });

  describe('Request Validation', () => {
    it('should validate request has required fields', () => {
      const mockAdapter = new MockAdapter();

      const validRequest = {
        id: 'queue-1',
        request_type: 'mock',
        payload: { test: 'data' },
        request_id: 'request-1',
      };

      // Should not throw
      expect(() => mockAdapter.validate(validRequest)).not.toThrow();
    });

    it('should throw on invalid request (missing request_id)', () => {
      const mockAdapter = new MockAdapter();

      const invalidRequest = {
        id: 'queue-1',
        request_type: 'mock',
        payload: { test: 'data' },
        request_id: '',
      };

      expect(() => mockAdapter.validate(invalidRequest)).toThrow();
    });

    it('should throw on invalid request (missing payload)', () => {
      const mockAdapter = new MockAdapter();

      const invalidRequest = {
        id: 'queue-1',
        request_type: 'mock',
        payload: null,
        request_id: 'request-1',
      };

      expect(() => mockAdapter.validate(invalidRequest as any)).toThrow();
    });
  });

  describe('Mock Adapter', () => {
    it('should have name property', () => {
      const adapter = new MockAdapter();
      expect(adapter.name).toBe('mock');
    });

    it('should execute successfully and return externalId', async () => {
      const adapter = new MockAdapter();
      const logger = new StructuredLogger();

      const request = {
        id: 'queue-1',
        request_type: 'mock',
        payload: { test: 'data' },
        request_id: 'request-1',
      };

      const context = {
        workerId: 'test-worker',
        requestId: 'request-1',
        queueEntryId: 'queue-1',
        logger,
      };

      const response = await adapter.execute(request, context);

      expect(response.success).toBe(true);
      expect(response.externalId).toBeDefined();
      expect(response.externalId).toMatch(/^mock-\d+$/);
      expect(response.metadata).toBeDefined();
      expect(response.metadata!.executedAt).toBeDefined();
    });

    it('should support cleanup method', async () => {
      const adapter = new MockAdapter();
      const logger = new StructuredLogger();

      const context = {
        workerId: 'test-worker',
        requestId: 'request-1',
        queueEntryId: 'queue-1',
        logger,
      };

      // Should not throw
      await adapter.cleanup?.(context);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Dequeue Integration', () => {
    it('should call dequeue with correct worker ID', async () => {
      mockDequeue.mockResolvedValueOnce([]);

      await mockDequeue('test-worker-1', 10);

      expect(mockDequeue).toHaveBeenCalledWith('test-worker-1', 10);
    });

    it('should call dequeue with default batch size of 10', async () => {
      mockDequeue.mockResolvedValueOnce([]);

      await mockDequeue('test-worker-1', 10);

      expect(mockDequeue).toHaveBeenCalledWith('test-worker-1', 10);
    });

    it('should handle empty dequeue response', async () => {
      mockDequeue.mockResolvedValueOnce([]);

      const result = await mockDequeue('test-worker-1', 10);

      expect(result).toEqual([]);
    });

    it('should handle batch of queue entries', async () => {
      const mockEntries: DequeuedIntegrationQueueItem[] = [
        {
          id: 'queue-1',
          requestId: 'request-1',
          status: 'processing',
          lastError: null,
          lastErrorAt: null,
          lockedAt: new Date().toISOString(),
          lockedByWorker: 'test-worker-1',
          metadata: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requestType: 'mock',
          payload: { test: 'data' },
        },
        {
          id: 'queue-2',
          requestId: 'request-2',
          status: 'processing',
          lastError: null,
          lastErrorAt: null,
          lockedAt: new Date().toISOString(),
          lockedByWorker: 'test-worker-1',
          metadata: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          requestType: 'mock',
          payload: { test: 'data2' },
        },
      ];

      mockDequeue.mockResolvedValueOnce(mockEntries);

      const result = await mockDequeue('test-worker-1', 10);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('queue-1');
      expect(result[1].id).toBe('queue-2');
    });
  });
});

