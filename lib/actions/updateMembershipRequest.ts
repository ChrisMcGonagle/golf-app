import { createServiceRoleClient } from '../supabase/server';

type MembershipRequestWorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
type MembershipRequestOverallStatus = 'pending' | 'in_progress' | 'completed';

export type MembershipRequestUpdate = Partial<{
  status: MembershipRequestOverallStatus;
  membership_status: MembershipRequestWorkflowStatus;
  golfireland_account: MembershipRequestWorkflowStatus;
  brs_account: MembershipRequestWorkflowStatus;
  clubv1_account: MembershipRequestWorkflowStatus;
  external_id: string | null;
  updated_at: string;
}>;

export async function updateMembershipRequest(
  requestId: string,
  updates: MembershipRequestUpdate
): Promise<void> {
  if (requestId.trim() === '') {
    throw new Error('requestId is required');
  }

  const supabase = createServiceRoleClient();
  const updatePayload = {
    ...updates,
    updated_at: updates.updated_at ?? new Date().toISOString(),
  };

  const { error } = await supabase
    .from('membership_requests')
    .update(updatePayload)
    .eq('id', requestId);

  if (error) {
    throw new Error(`Failed to update membership_requests: ${error.message}`);
  }
}