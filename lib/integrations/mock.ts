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
    context.logger.info('mock adapter executing', {
      request_id: request.request_id,
    });

    // Simulate successful execution with generated external ID
    const externalId = `mock-${Date.now()}`;

    context.logger.info('mock adapter completed', {
      request_id: request.request_id,
      externalId,
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
    context.logger.info('mock adapter cleanup', {
      request_id: context.requestId,
    });
  }
}
