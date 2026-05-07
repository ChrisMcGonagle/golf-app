import { redirect } from 'next/navigation';
import type { RequestRow, RequestStatus, RequestStepState } from '@/app/(authenticated)/dashboard/(with-sidebar)/requests/requestsViewModel';
import { getActiveUserSession } from '@/lib/auth/activeUserSession';
import { createServiceRoleClient } from '@/lib/supabase/server';

type MembershipRequestPayload = {
  type?: unknown;
  firstName?: unknown;
  surname?: unknown;
  submitted_at?: unknown;
  flow?: {
    intent?: unknown;
  };
  personal?: {
    email?: unknown;
    phone?: unknown;
  };
  membership?: {
    homeClub?: unknown;
    previousClubs?: unknown;
  };
  safeguarding?: {
    additionalAssistance?: unknown;
  };
};

type MembershipRequestRecord = {
  id: string;
  payload: MembershipRequestPayload | null;
  request_type: string;
  operator_id: string;
  requester_name: string;
  requester_email: string;
  status: string;
  golfireland_account: string;
  brs_account: string;
  clubv1_account: string;
  membership_status: string;
  submitted_at: string;
  created_at: string;
};

type ProfileRecord = {
  id: string;
  display_name: string;
};

async function requireAdminSession() {
  const activeUser = await getActiveUserSession();

  if (!activeUser) {
    redirect('/select-user');
  }

  if (activeUser.role !== 'admin') {
    redirect('/dashboard');
  }

  return activeUser;
}

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildRequesterName(payload: MembershipRequestPayload | null, fallback: string): string {
  const firstName = getStringValue(payload?.firstName);
  const surname = getStringValue(payload?.surname);
  const fullName = `${firstName} ${surname}`.trim();

  return fullName || fallback;
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return `${datePart}, ${timePart}`;
}

function mapRequestStatus(status: string): RequestStatus {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    default:
      return 'Pending';
  }
}

function mapStepState(state: string): RequestStepState {
  switch (state) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'active';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

function getIntent(intent: unknown): 'New' | 'Renew' {
  return intent === 'renewal' ? 'Renew' : 'New';
}

function getRequestNotes(payload: MembershipRequestPayload | null): string {
  const additionalAssistance = getStringValue(payload?.safeguarding?.additionalAssistance);

  if (additionalAssistance) {
    return additionalAssistance;
  }

  const previousClubs = payload?.membership?.previousClubs;

  if (typeof previousClubs !== 'string' || !previousClubs.trim()) {
    return 'No additional notes provided.';
  }

  try {
    const parsed = JSON.parse(previousClubs) as Array<{ name?: unknown }>;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 'No additional notes provided.';
    }

    const names = parsed
      .map((entry) => getStringValue(entry?.name))
      .filter(Boolean)
      .join(', ');

    return names ? `Previous clubs: ${names}` : 'No additional notes provided.';
  } catch {
    return 'No additional notes provided.';
  }
}

function mapMembershipRequestToRow(
  record: MembershipRequestRecord,
  operatorNameById: Map<string, string>
): RequestRow {
  const payload = record.payload;
  const request = getStringValue(payload?.type) || record.request_type;
  const requester = buildRequesterName(payload, record.requester_name);
  const submittedAt = getStringValue(payload?.submitted_at) || record.submitted_at;

  return {
    id: record.id,
    request,
    creationDateTime: formatDateTime(record.created_at),
    submittedDateTime: formatDateTime(submittedAt),
    requester,
    intent: getIntent(payload?.flow?.intent),
    intentSource: 'form',
    membershipStatus: record.membership_status,
    operatorName: operatorNameById.get(record.operator_id),
    status: mapRequestStatus(record.status),
    steps: [
      {
        label: '1',
        title: 'Golf Ireland',
        state: mapStepState(record.golfireland_account),
        showWarningIcon: record.golfireland_account === 'failed',
      },
      {
        label: '2',
        title: 'BRS',
        state: mapStepState(record.brs_account),
        showWarningIcon: record.brs_account === 'failed',
      },
      {
        label: '3',
        title: 'ClubV1',
        state: mapStepState(record.clubv1_account),
        showWarningIcon: record.clubv1_account === 'failed',
      },
    ],
    payload: {
      name: requester,
      email: getStringValue(payload?.personal?.email) || record.requester_email,
      membershipType: request,
      phone: getStringValue(payload?.personal?.phone),
      club: getStringValue(payload?.membership?.homeClub) || 'Not provided',
      notes: getRequestNotes(payload),
    },
  };
}

export async function getMembershipRequestsForAdmin(): Promise<RequestRow[]> {
  await requireAdminSession();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('membership_requests')
    .select(
      'id, payload, request_type, operator_id, requester_name, requester_email, status, golfireland_account, brs_account, clubv1_account, membership_status, submitted_at, created_at'
    )
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const records = (data ?? []) as MembershipRequestRecord[];
  const operatorIds = Array.from(new Set(records.map((record) => record.operator_id).filter(Boolean)));
  const operatorNameById = new Map<string, string>();

  if (operatorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', operatorIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    (profiles as ProfileRecord[] | null)?.forEach((profile) => {
      operatorNameById.set(profile.id, profile.display_name);
    });
  }

  return records.map((record) => mapMembershipRequestToRow(record, operatorNameById));
}

export async function getPendingMembershipRequestCountForAdmin(): Promise<number> {
  await requireAdminSession();

  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from('membership_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}