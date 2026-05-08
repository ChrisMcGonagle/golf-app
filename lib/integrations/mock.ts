/**
 * Mock adapter for testing
 * Implements the IntegrationAdapter interface
 */

import {
  IntegrationAdapter,
  IntegrationRequest,
  ExecutionContext,
  AdapterResponse,
} from './types';

export class MockAdapter implements IntegrationAdapter {
  readonly name = 'mock';

  validate(request: IntegrationRequest): void {
    if (!request.request_id) {
      throw new Error('request_id is required');
    }
    if (!request.payload || typeof request.payload !== 'object') {
      throw new Error('payload is required and must be an object');
    }
  }

  async execute(request: IntegrationRequest, context: ExecutionContext): Promise<AdapterResponse> {
    context.logger.info({
      event_type: 'form_fill_in_progress',
      adapter_name: this.name,
      queue_id: context.queueEntryId,
      request_id: request.request_id,
      worker_id: context.workerId,
    });

    context.logger.info({
      event_type: 'form_submission_attempted',
      adapter_name: this.name,
      queue_id: context.queueEntryId,
      request_id: request.request_id,
      worker_id: context.workerId,
    });

    // Simulate successful execution with generated external ID
    const externalId = `mock-${Date.now()}`;

    context.logger.info({
      event_type: 'adapter_execution_completed',
      adapter_name: this.name,
      external_id: externalId,
      error_message: null,
      screenshot_path: null,
      queue_id: context.queueEntryId,
      request_id: request.request_id,
      worker_id: context.workerId,
    });

    return {
      success: true,
      externalId,
      metadata: {
        executedAt: new Date().toISOString(),
      },
    };
  }

  async cleanup(context: ExecutionContext): Promise<void> {
    context.logger.info({
      event_type: 'adapter_cleanup_completed',
      adapter_name: this.name,
      external_id: null,
      error_message: null,
      screenshot_path: null,
      queue_id: context.queueEntryId,
      request_id: context.requestId,
      worker_id: context.workerId,
    });
  }
}
