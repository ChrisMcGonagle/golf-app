import { getIntegrationAdapterConfig } from '@/lib/integrations/config'
import {
  IntegrationAdapter,
  IntegrationAdapterRequest,
  IntegrationExecutionResult,
  JsonObject,
  IntegrationRequestContext,
} from '@/lib/integrations/types'

function isRecord(value: IntegrationAdapterRequest['payload']): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createMockAdapter(): IntegrationAdapter {
  const config = getIntegrationAdapterConfig('mock')

  if (!config.enabled) {
    throw new Error('Integration adapter is disabled: mock')
  }

  return {
    name: 'mock',
    validate(request) {
      return request.requestId.trim() !== '' && request.requestType.trim() !== ''
    },
    async execute(request: IntegrationAdapterRequest, context: IntegrationRequestContext): Promise<IntegrationExecutionResult> {
      context.logger({
        level: 'info',
        message: 'Executing integration adapter',
        requestId: context.requestId,
        adapterName: context.adapterName,
        metadata: {
          idempotencyKey: context.idempotencyKey,
        },
      })

      if (isRecord(request.payload) && request.payload.shouldFail === true) {
        return {
          success: false,
          error: context.handleError(new Error('Mock adapter failure'), context),
          metadata: {
            outcome: 'mock-failure',
          },
        }
      }

      return {
        success: true,
        externalId: `mock-${request.requestId}`,
        metadata: {
          outcome: 'mock-success',
          attemptNumber: context.attemptNumber,
        },
      }
    },
    async cleanup(context) {
      context.logger({
        level: 'info',
        message: 'Cleaning up integration adapter context',
        requestId: context.requestId,
        adapterName: context.adapterName,
      })
    },
  }
}