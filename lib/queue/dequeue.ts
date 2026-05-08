import { createServiceRoleClient } from '@/lib/supabase/server';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

type JsonObject = {
  [key: string]: JsonValue;
};

type ClaimIntegrationQueueRow = {
  id: string;
  request_id: string;
  status: string;
  last_error: string | null;
  last_error_at: string | null;
  locked_at: string | null;
  locked_by_worker: string;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
  request_type: string;
  payload: JsonValue;
};

export type DequeuedIntegrationQueueItem = {
  id: string;
  requestId: string;
  status: 'processing';
  lastError: string | null;
  lastErrorAt: string | null;
  lockedAt: string | null;
  lockedByWorker: string;
  metadata: JsonValue;
  createdAt: string;
  updatedAt: string;
  requestType: string;
  payload: JsonValue;
};

function mapClaimedRow(row: ClaimIntegrationQueueRow, workerId: string): DequeuedIntegrationQueueItem {
  if (row.status !== 'processing') {
    throw new Error(`Unexpected claimed queue status: ${row.status}`);
  }

  if (row.locked_at === null || row.locked_by_worker !== workerId) {
    throw new Error('Claimed queue row is missing lock metadata or is locked by another worker');
  }

  return {
    id: row.id,
    requestId: row.request_id,
    status: 'processing',
    lastError: row.last_error,
    lastErrorAt: row.last_error_at,
    lockedAt: row.locked_at,
    lockedByWorker: row.locked_by_worker,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requestType: row.request_type,
    payload: row.payload,
  };
}

export async function dequeue(workerId: string, batchSize = 10): Promise<DequeuedIntegrationQueueItem[]> {
  if (workerId.trim() === '') {
    throw new Error('workerId is required');
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('claim_integration_queue', {
    claim_worker_id: workerId,
    claim_batch_size: batchSize,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ClaimIntegrationQueueRow[]).map((row) => mapClaimedRow(row, workerId));
}