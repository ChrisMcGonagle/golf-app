import {
  IntegrationAdapter,
  IntegrationRequest,
  AdapterResponse,
  ExecutionContext,
} from '@/lib/integrations/types'

export function createMockAdapter(): IntegrationAdapter {
  return {
    name: 'mock',
    validate(request: IntegrationRequest): void {
      if (!request.request_id) {
        throw new Error('request_id is required')
      }
      if (!request.request_type) {
        throw new Error('request_type is required')
      }
      if (!request.payload || typeof request.payload !== 'object') {
        throw new Error('payload is required and must be an object')
      }
    },
    async execute(request: IntegrationRequest, context: ExecutionContext): Promise<AdapterResponse> {
      context.logger.info({
        event_type: 'mock_adapter_executing',
        request_id: request.request_id,
        queue_entry_id: context.queueEntryId,
        worker_id: context.workerId,
      })

      const externalId = `mock-${Date.now()}-${request.request_id}`

      context.logger.info({
        event_type: 'mock_adapter_completed',
        external_id: externalId,
        request_id: request.request_id,
        queue_entry_id: context.queueEntryId,
        worker_id: context.workerId,
      })

      return {
        success: true,
        externalId,
        metadata: {
          executedAt: new Date().toISOString(),
          requestId: request.request_id,
        },
      }
    },
    async cleanup(context: ExecutionContext): Promise<void> {
      context.logger.info({
        event_type: 'mock_adapter_cleanup',
        queue_entry_id: context.queueEntryId,
        worker_id: context.workerId,
        request_id: context.requestId,
      })
    },
  }
}