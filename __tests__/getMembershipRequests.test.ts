jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

jest.mock('@/lib/auth/activeUserSession', () => ({
  getActiveUserSession: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

import { redirect } from 'next/navigation';
import { getActiveUserSession } from '@/lib/auth/activeUserSession';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  getMembershipRequestsForAdmin,
  getPendingMembershipRequestCountForAdmin,
} from '@/lib/actions/getMembershipRequests';

const mockRedirect = jest.mocked(redirect);
const mockGetActiveUserSession = jest.mocked(getActiveUserSession);
const mockCreateServiceRoleClient = jest.mocked(createServiceRoleClient);

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

describe('getMembershipRequestsForAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /select-user when there is no active user session', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce(null);

    await expect(getMembershipRequestsForAdmin()).rejects.toThrow('NEXT_REDIRECT:/select-user');

    expect(mockRedirect).toHaveBeenCalledWith('/select-user');
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('redirects to /dashboard when the active user is not an admin', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce({
      profileId: 'staff-123',
      displayName: 'Alex Operator',
      role: 'staff',
      expiresAt: Date.now() + 60_000,
    });

    await expect(getMembershipRequestsForAdmin()).rejects.toThrow('NEXT_REDIRECT:/dashboard');

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('uses the service role client to load membership requests, profile names, and map request rows', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce({
      profileId: 'admin-123',
      displayName: 'Pat Admin',
      role: 'admin',
      expiresAt: Date.now() + 60_000,
    });

    const membershipRequestRows = [
      {
        id: 'req-1',
        payload: {
          type: 'Full Member',
          firstName: 'Aisling',
          surname: 'Murphy',
          submitted_at: '2026-05-05T10:05:00.000Z',
          flow: { intent: 'renewal' },
          personal: {
            email: 'aisling.murphy@example.com',
            phone: '(087) 321-4567',
          },
          membership: {
            homeClub: 'Elm Park Golf Club',
            previousClubs: JSON.stringify([{ name: 'Old Head' }]),
          },
          safeguarding: {
            additionalAssistance: 'Requires buggy storage near the first tee.',
          },
        },
        request_type: 'Legacy Type',
        operator_id: 'operator-1',
        requester_name: 'Fallback Name',
        requester_email: 'fallback@example.com',
        status: 'pending',
        golfireland_account: 'failed',
        brs_account: 'in_progress',
        clubv1_account: 'pending',
        membership_status: 'Awaiting Review',
        submitted_at: '2026-05-05T09:59:00.000Z',
        created_at: '2026-05-05T09:30:00.000Z',
      },
      {
        id: 'req-2',
        payload: {
          flow: { intent: 'new' },
          personal: {
            phone: '(086) 555-0198',
          },
          membership: {
            previousClubs: JSON.stringify([{ name: 'Portmarnock' }, { name: 'Royal Dublin' }]),
          },
        },
        request_type: 'Senior Member',
        operator_id: 'operator-2',
        requester_name: 'Brian Kelly',
        requester_email: 'brian.kelly@example.com',
        status: 'in_progress',
        golfireland_account: 'completed',
        brs_account: 'pending',
        clubv1_account: 'completed',
        membership_status: 'In Review',
        submitted_at: '2026-04-18T08:26:00.000Z',
        created_at: '2026-04-18T08:10:00.000Z',
      },
      {
        id: 'req-3',
        payload: {
          type: 'Student Member',
          firstName: 'Ciara',
          surname: "O'Brien",
          flow: { intent: 'new' },
          personal: {
            email: 'ciara.obrien@example.com',
            phone: '(085) 777-2134',
          },
          membership: {
            homeClub: 'Lahinch Golf Club',
            previousClubs: 'not-json',
          },
        },
        request_type: 'Ignored Type',
        operator_id: '',
        requester_name: 'Fallback Ciara',
        requester_email: 'fallback-ciara@example.com',
        status: 'completed',
        golfireland_account: 'completed',
        brs_account: 'completed',
        clubv1_account: 'completed',
        membership_status: 'Approved',
        submitted_at: '2026-03-01T12:00:00.000Z',
        created_at: '2026-03-01T11:45:00.000Z',
      },
      {
        id: 'req-4',
        payload: {
          type: 'Overseas Life',
          firstName: 'Daniel',
          surname: 'Flynn',
          flow: { intent: 'renewal' },
          personal: {
            email: 'daniel.flynn@example.com',
            phone: '(083) 444-9921',
          },
          membership: {
            homeClub: 'Royal County Down',
          },
        },
        request_type: 'Overseas Life',
        operator_id: 'operator-1',
        requester_name: 'Fallback Daniel',
        requester_email: 'fallback-daniel@example.com',
        status: 'failed',
        golfireland_account: 'completed',
        brs_account: 'failed',
        clubv1_account: 'pending',
        membership_status: 'Awaiting Retry',
        submitted_at: '2026-02-02T08:45:00.000Z',
        created_at: '2026-02-02T08:15:00.000Z',
      },
    ];

    const membershipRequestsOrder = jest.fn().mockResolvedValue({
      data: membershipRequestRows,
      error: null,
    });
    const membershipRequestsSelect = jest.fn().mockReturnValue({
      order: membershipRequestsOrder,
    });
    const profilesIn = jest.fn().mockResolvedValue({
      data: [
        { id: 'operator-1', display_name: 'Alex Operator' },
        { id: 'operator-2', display_name: 'Bernie Admin' },
      ],
      error: null,
    });
    const profilesSelect = jest.fn().mockReturnValue({
      in: profilesIn,
    });
    const from = jest.fn((table: string) => {
      if (table === 'membership_requests') {
        return { select: membershipRequestsSelect };
      }

      if (table === 'profiles') {
        return { select: profilesSelect };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    mockCreateServiceRoleClient.mockReturnValue({ from } as never);

    const rows = await getMembershipRequestsForAdmin();

    expect(mockCreateServiceRoleClient).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('membership_requests');
    expect(membershipRequestsSelect).toHaveBeenCalledWith(
      'id, payload, request_type, operator_id, requester_name, requester_email, status, golfireland_account, brs_account, clubv1_account, membership_status, submitted_at, created_at'
    );
    expect(membershipRequestsOrder).toHaveBeenCalledWith('submitted_at', { ascending: false });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(profilesSelect).toHaveBeenCalledWith('id, display_name');
    expect(profilesIn).toHaveBeenCalledWith('id', ['operator-1', 'operator-2']);

    expect(rows).toEqual([
      {
        id: 'req-1',
        request: 'Full Member',
        creationDateTime: formatDateTime('2026-05-05T09:30:00.000Z'),
        submittedDateTime: formatDateTime('2026-05-05T10:05:00.000Z'),
        requester: 'Aisling Murphy',
        intent: 'Renew',
        intentSource: 'form',
        membershipStatus: 'Awaiting Review',
        operatorName: 'Alex Operator',
        status: 'Pending',
        steps: [
          {
            label: '1',
            title: 'Golf Ireland',
            state: 'failed',
            showWarningIcon: true,
          },
          {
            label: '2',
            title: 'BRS',
            state: 'active',
            showWarningIcon: false,
          },
          {
            label: '3',
            title: 'ClubV1',
            state: 'pending',
            showWarningIcon: false,
          },
        ],
        payload: {
          name: 'Aisling Murphy',
          email: 'aisling.murphy@example.com',
          membershipType: 'Full Member',
          phone: '(087) 321-4567',
          club: 'Elm Park Golf Club',
          notes: 'Requires buggy storage near the first tee.',
        },
      },
      {
        id: 'req-2',
        request: 'Senior Member',
        creationDateTime: formatDateTime('2026-04-18T08:10:00.000Z'),
        submittedDateTime: formatDateTime('2026-04-18T08:26:00.000Z'),
        requester: 'Brian Kelly',
        intent: 'New',
        intentSource: 'form',
        membershipStatus: 'In Review',
        operatorName: 'Bernie Admin',
        status: 'In Progress',
        steps: [
          {
            label: '1',
            title: 'Golf Ireland',
            state: 'completed',
            showWarningIcon: false,
          },
          {
            label: '2',
            title: 'BRS',
            state: 'pending',
            showWarningIcon: false,
          },
          {
            label: '3',
            title: 'ClubV1',
            state: 'completed',
            showWarningIcon: false,
          },
        ],
        payload: {
          name: 'Brian Kelly',
          email: 'brian.kelly@example.com',
          membershipType: 'Senior Member',
          phone: '(086) 555-0198',
          club: 'Not provided',
          notes: 'Previous clubs: Portmarnock, Royal Dublin',
        },
      },
      {
        id: 'req-3',
        request: 'Student Member',
        creationDateTime: formatDateTime('2026-03-01T11:45:00.000Z'),
        submittedDateTime: formatDateTime('2026-03-01T12:00:00.000Z'),
        requester: "Ciara O'Brien",
        intent: 'New',
        intentSource: 'form',
        membershipStatus: 'Approved',
        operatorName: undefined,
        status: 'Completed',
        steps: [
          {
            label: '1',
            title: 'Golf Ireland',
            state: 'completed',
            showWarningIcon: false,
          },
          {
            label: '2',
            title: 'BRS',
            state: 'completed',
            showWarningIcon: false,
          },
          {
            label: '3',
            title: 'ClubV1',
            state: 'completed',
            showWarningIcon: false,
          },
        ],
        payload: {
          name: "Ciara O'Brien",
          email: 'ciara.obrien@example.com',
          membershipType: 'Student Member',
          phone: '(085) 777-2134',
          club: 'Lahinch Golf Club',
          notes: 'No additional notes provided.',
        },
      },
      {
        id: 'req-4',
        request: 'Overseas Life',
        creationDateTime: formatDateTime('2026-02-02T08:15:00.000Z'),
        submittedDateTime: formatDateTime('2026-02-02T08:45:00.000Z'),
        requester: 'Daniel Flynn',
        intent: 'Renew',
        intentSource: 'form',
        membershipStatus: 'Awaiting Retry',
        operatorName: 'Alex Operator',
        status: 'Failed',
        steps: [
          {
            label: '1',
            title: 'Golf Ireland',
            state: 'completed',
            showWarningIcon: false,
          },
          {
            label: '2',
            title: 'BRS',
            state: 'failed',
            showWarningIcon: true,
          },
          {
            label: '3',
            title: 'ClubV1',
            state: 'failed',
            showWarningIcon: false,
          },
        ],
        payload: {
          name: 'Daniel Flynn',
          email: 'daniel.flynn@example.com',
          membershipType: 'Overseas Life',
          phone: '(083) 444-9921',
          club: 'Royal County Down',
          notes: 'No additional notes provided.',
        },
      },
    ]);
  });

  it('throws when the membership request query fails', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce({
      profileId: 'admin-123',
      displayName: 'Pat Admin',
      role: 'admin',
      expiresAt: Date.now() + 60_000,
    });

    const membershipRequestsOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'membership_requests unavailable' },
    });
    const membershipRequestsSelect = jest.fn().mockReturnValue({
      order: membershipRequestsOrder,
    });
    const from = jest.fn().mockReturnValue({
      select: membershipRequestsSelect,
    });

    mockCreateServiceRoleClient.mockReturnValue({ from } as never);

    await expect(getMembershipRequestsForAdmin()).rejects.toThrow('membership_requests unavailable');
    expect(from).toHaveBeenCalledWith('membership_requests');
  });
});

describe('getPendingMembershipRequestCountForAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /select-user when there is no active user session', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce(null);

    await expect(getPendingMembershipRequestCountForAdmin()).rejects.toThrow('NEXT_REDIRECT:/select-user');

    expect(mockRedirect).toHaveBeenCalledWith('/select-user');
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('redirects to /dashboard when the active user is not an admin', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce({
      profileId: 'staff-123',
      displayName: 'Alex Operator',
      role: 'staff',
      expiresAt: Date.now() + 60_000,
    });

    await expect(getPendingMembershipRequestCountForAdmin()).rejects.toThrow('NEXT_REDIRECT:/dashboard');

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns the exact pending request count using a head query', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce({
      profileId: 'admin-123',
      displayName: 'Pat Admin',
      role: 'admin',
      expiresAt: Date.now() + 60_000,
    });

    const membershipRequestsEq = jest.fn().mockResolvedValue({
      count: 12,
      error: null,
    });
    const membershipRequestsSelect = jest.fn().mockReturnValue({
      eq: membershipRequestsEq,
    });
    const from = jest.fn((table: string) => {
      if (table === 'membership_requests') {
        return { select: membershipRequestsSelect };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    mockCreateServiceRoleClient.mockReturnValue({ from } as never);

    await expect(getPendingMembershipRequestCountForAdmin()).resolves.toBe(12);

    expect(mockCreateServiceRoleClient).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('membership_requests');
    expect(membershipRequestsSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(membershipRequestsEq).toHaveBeenCalledWith('status', 'pending');
  });

  it('returns 0 when the count response is null', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce({
      profileId: 'admin-123',
      displayName: 'Pat Admin',
      role: 'admin',
      expiresAt: Date.now() + 60_000,
    });

    const membershipRequestsEq = jest.fn().mockResolvedValue({
      count: null,
      error: null,
    });
    const membershipRequestsSelect = jest.fn().mockReturnValue({
      eq: membershipRequestsEq,
    });
    const from = jest.fn((table: string) => {
      if (table === 'membership_requests') {
        return { select: membershipRequestsSelect };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    mockCreateServiceRoleClient.mockReturnValue({ from } as never);

    await expect(getPendingMembershipRequestCountForAdmin()).resolves.toBe(0);
  });
});