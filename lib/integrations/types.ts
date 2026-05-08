/**
 * Integration adapter interface contract
 * All external integration adapters must implement this interface
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = {
  [key: string]: JsonValue;
};

export type LogEntry = string | JsonObject;

/**
 * Request context passed to adapter execution
 */
export interface IntegrationRequest {
  id: string;
  request_type: string;
  payload: JsonValue;
  request_id: string;
  [key: string]: JsonValue;
}

/**
 * Execution context with logging and metadata
 */
export interface ExecutionContext {
  workerId: string;
  requestId: string;
  queueEntryId: string;
  logger: IntegrationLogger;
  [key: string]: string | IntegrationLogger;
}

/**
 * Structured logging interface
 */
export interface IntegrationLogger {
  info(entry: LogEntry, data?: JsonObject): void;
  warn(entry: LogEntry, data?: JsonObject): void;
  error(entry: LogEntry, data?: JsonObject): void;
}

/**
 * Adapter execution response
 */
export interface AdapterResponse {
  success: boolean;
  externalId?: string;
  error?: string;
  screenshotPath?: string;
  metadata?: JsonObject;
}

/**
 * Base adapter interface all integrations must implement
 */
export interface IntegrationAdapter {
  /**
   * Unique identifier for this adapter (e.g., "golf_ireland")
   */
  readonly name: string;

  /**
   * Validate that the request payload is valid for this adapter
   * @throws Error if validation fails
   */
  validate(request: IntegrationRequest): void;

  /**
   * Execute the integration action
   * Must be idempotent - safe to call multiple times with same input
   * @returns Response with success/failure and externalId if successful
   */
  execute(request: IntegrationRequest, context: ExecutionContext): Promise<AdapterResponse>;

  /**
   * Optional cleanup after execution
   */
  cleanup?(context: ExecutionContext): Promise<void>;
}
