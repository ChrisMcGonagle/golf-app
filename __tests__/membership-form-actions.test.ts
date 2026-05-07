jest.mock('@/lib/auth/activeUserSession', () => ({
  getActiveUserSession: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

import { getActiveUserSession } from '@/lib/auth/activeUserSession';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { submitMembershipForm } from '@/app/(authenticated)/dashboard/membership/form/actions';

const mockGetActiveUserSession = jest.mocked(getActiveUserSession);
const mockCreateServiceRoleClient = jest.mocked(createServiceRoleClient);

describe('submitMembershipForm', () => {
  const insert = jest.fn();
  const from = jest.fn(() => ({ insert }));

  beforeEach(() => {
    jest.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    mockCreateServiceRoleClient.mockReturnValue({ from } as never);
    mockGetActiveUserSession.mockResolvedValue({
      profileId: 'staff-123',
      displayName: 'Alex Operator',
      role: 'staff',
      expiresAt: Date.now() + 60_000,
    });
  });

  it('writes normalized submissions into membership_requests with the authenticated operator id', async () => {
    const payload = {
      flow: {
        intent: 'new',
        typeId: 'Full Member',
        formCreatedAt: '2026-05-05T10:00:00.000Z',
      },
      formSubmittedAt: '2026-05-05T10:05:00.000Z',
      personal: {
        firstName: 'Aisling',
        surname: 'Murphy',
        email: 'aisling.murphy@example.com',
        phone: '(087) 321-4567',
      },
      membership: {
        homeClub: 'Elm Park Golf Club',
      },
      safeguarding: {
        additionalAssistance: 'Recently moved to Dublin and prefers morning tee times.',
      },
      consent: {
        acceptedTerms: 'true',
      },
    };

    const result = await submitMembershipForm(payload);

    expect(result).toEqual({ success: true });
    expect(from).toHaveBeenCalledWith('membership_requests');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        request_type: 'Full Member',
        operator_id: 'staff-123',
        requester_name: 'Aisling Murphy',
        requester_email: 'aisling.murphy@example.com',
        membership_status: 'pending',
        status: 'pending',
        golfireland_account: 'pending',
        brs_account: 'pending',
        clubv1_account: 'pending',
        payload: expect.objectContaining({
          type: 'Full Member',
          firstName: 'Aisling',
          surname: 'Murphy',
          submitted_at: '2026-05-05T10:05:00.000Z',
          membership: expect.objectContaining({
            homeClub: 'Elm Park Golf Club',
          }),
        }),
      })
    );
  });

  it('fails closed when no authenticated operator session exists', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce(null);

    const result = await submitMembershipForm({});

    expect(result).toEqual({
      success: false,
      error: 'Active operator session is required.',
    });
    expect(from).not.toHaveBeenCalled();
  });
});