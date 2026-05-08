jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

import * as fs from 'fs';
import * as path from 'path';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { dequeue } from '@/lib/queue/dequeue';

const mockCreateServiceRoleClient = jest.mocked(createServiceRoleClient);

describe('dequeue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls claim_integration_queue with the default batch size of 10', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'queue-1',
          request_id: 'request-1',
          status: 'processing',
          last_error: null,
          last_error_at: null,
          locked_at: '2026-05-08T10:00:00.000Z',
          locked_by_worker: 'worker-a',
          metadata: { source: 'membership_request' },
          created_at: '2026-05-08T09:59:00.000Z',
          updated_at: '2026-05-08T10:00:00.000Z',
          request_type: 'Full Member',
          payload: { firstName: 'Pat' },
        },
      ],
      error: null,
    });

    mockCreateServiceRoleClient.mockReturnValue({ rpc } as never);

    await expect(dequeue('worker-a')).resolves.toEqual([
      {
        id: 'queue-1',
        requestId: 'request-1',
        status: 'processing',
        lastError: null,
        lastErrorAt: null,
        lockedAt: '2026-05-08T10:00:00.000Z',
        lockedByWorker: 'worker-a',
        metadata: { source: 'membership_request' },
        createdAt: '2026-05-08T09:59:00.000Z',
        updatedAt: '2026-05-08T10:00:00.000Z',
        requestType: 'Full Member',
        payload: { firstName: 'Pat' },
      },
    ]);

    expect(mockCreateServiceRoleClient).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('claim_integration_queue', {
      claim_worker_id: 'worker-a',
      claim_batch_size: 10,
    });
  });

  it('passes through an explicit batch size', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [], error: null });

    mockCreateServiceRoleClient.mockReturnValue({ rpc } as never);

    await expect(dequeue('worker-b', 3)).resolves.toEqual([]);

    expect(rpc).toHaveBeenCalledWith('claim_integration_queue', {
      claim_worker_id: 'worker-b',
      claim_batch_size: 3,
    });
  });

  it('rejects a blank worker id before calling the database function', async () => {
    const rpc = jest.fn();

    mockCreateServiceRoleClient.mockReturnValue({ rpc } as never);

    await expect(dequeue('   ')).rejects.toThrow('workerId is required');

    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('throws the rpc error without retrying', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'claim failed' },
    });

    mockCreateServiceRoleClient.mockReturnValue({ rpc } as never);

    await expect(dequeue('worker-c')).rejects.toThrow('claim failed');

    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('enforces the processing-only claim contract on returned rows', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'queue-2',
          request_id: 'request-2',
          status: 'pending',
          last_error: null,
          last_error_at: null,
          locked_at: null,
          locked_by_worker: 'worker-d',
          metadata: null,
          created_at: '2026-05-08T10:01:00.000Z',
          updated_at: '2026-05-08T10:01:00.000Z',
          request_type: 'Student Member',
          payload: null,
        },
      ],
      error: null,
    });

    mockCreateServiceRoleClient.mockReturnValue({ rpc } as never);

    await expect(dequeue('worker-d')).rejects.toThrow('Unexpected claimed queue status: pending');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

describe('PBI-040 schema contract', () => {
  it('defines the membership request auto-enqueue trigger with pending queue rows', () => {
    const schemaPath = path.join(process.cwd(), 'supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    expect(schema).toContain('create or replace function public.enqueue_membership_request_for_integration()');
    expect(schema).toContain("if new.status = 'pending' then");
    expect(schema).toContain("insert into public.integration_queue (request_id, status)");
    expect(schema).toContain("values (new.id, 'pending')");
    expect(schema).toContain('create trigger enqueue_membership_request_for_integration');
    expect(schema).toContain('after insert on public.membership_requests');
  });

  it('reasserts request_id as not null in the additive migration path', () => {
    const schemaPath = path.join(process.cwd(), 'supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    expect(schema).toContain('alter table public.integration_queue');
    expect(schema).toContain('add column if not exists request_id       uuid,');
    expect(schema).toContain('alter column request_id set not null;');
  });

  it('defines pending-only SQL claim semantics that move rows into processing', () => {
    const schemaPath = path.join(process.cwd(), 'supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    expect(schema).toContain("where iq.status = 'pending'");
    expect(schema).toContain("set status = 'processing'");
    expect(schema).toContain('locked_by_worker = claim_worker_id');
    expect(schema).toContain('claim_batch_size integer default 10');
  });
});