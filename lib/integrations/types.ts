type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export type JsonObject = {
  [key: string]: JsonValue
}

export type IntegrationLogLevel = 'info' | 'warn' | 'error'

export type IntegrationLogEntry = {
  level: IntegrationLogLevel
  message: string
  requestId: string
  adapterName: string
  metadata?: JsonObject
}

export type IntegrationLogger = (entry: IntegrationLogEntry) => void

export type IntegrationErrorHandler = (error: unknown, context: IntegrationRequestContext) => string

export type IntegrationRequestContext = {
  requestId: string
  adapterName: string
  idempotencyKey: string
  attemptNumber: number
  logger: IntegrationLogger
  handleError: IntegrationErrorHandler
}

export type IntegrationAdapterRequest = {
  requestId: string
  requestType: string
  payload: JsonValue
  metadata: JsonValue
}

export type IntegrationExecutionResult = {
  success: boolean
  externalId?: string
  error?: string
  metadata?: JsonObject
}

export interface IntegrationAdapter {
  name: string
  validate(request: IntegrationAdapterRequest): boolean
  /**
   * execute must treat context.idempotencyKey as the stable deduplication key for a logical request.
   * Replays with the same idempotencyKey must not create duplicate external side effects and should
   * resolve to the same logical outcome as the original attempt when the downstream system supports it.
   */
  execute(
    request: IntegrationAdapterRequest,
    context: IntegrationRequestContext,
  ): Promise<IntegrationExecutionResult>
  cleanup?(context: IntegrationRequestContext): Promise<void>
}