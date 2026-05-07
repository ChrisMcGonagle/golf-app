'use server';

import { getActiveUserSession } from '@/lib/auth/activeUserSession';
import { createServiceRoleClient } from '@/lib/supabase/server';

type MembershipFormSubmission = {
  flow?: {
    intent?: string;
    typeId?: string;
    memberId?: string;
    formCreatedAt?: string;
  };
  formSubmittedAt?: string;
  personal?: {
    firstName?: string;
    surname?: string;
    email?: string;
    phone?: string;
  };
  membership?: {
    homeClub?: string;
  };
  safeguarding?: {
    additionalAssistance?: string;
  };
  consent?: unknown;
};

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildRequesterName(firstName: string, surname: string): string {
  return `${firstName} ${surname}`.trim();
}

export async function submitMembershipForm(payload: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    const operator = await getActiveUserSession();

    if (!operator) {
      return { success: false, error: 'Active operator session is required.' };
    }

    const submission = (payload ?? {}) as MembershipFormSubmission;
    const requestType = getStringValue(submission.flow?.typeId);
    const firstName = getStringValue(submission.personal?.firstName);
    const surname = getStringValue(submission.personal?.surname);
    const requesterName = buildRequesterName(firstName, surname);
    const requesterEmail = getStringValue(submission.personal?.email);
    const submittedAt = getStringValue(submission.formSubmittedAt) || new Date().toISOString();

    if (!requestType) {
      return { success: false, error: 'Membership type is required.' };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('membership_requests')
      .insert({
        payload: {
          ...(submission as Record<string, unknown>),
          type: requestType,
          firstName,
          surname,
          submitted_at: submittedAt,
        },
        request_type: requestType,
        operator_id: operator.profileId,
        requester_name: requesterName,
        requester_email: requesterEmail,
        membership_status: 'pending',
        golfireland_account: 'pending',
        brs_account: 'pending',
        clubv1_account: 'pending',
        status: 'pending',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
