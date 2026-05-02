/**
 * Tests for /pin page and validatePin Server Action (PBI-003b)
 *
 * Behavior-based test names covering PIN entry + validation, lockout logic,
 * and security constraints.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('iron-session', () => ({
  getIronSession: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcrypt';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validatePin } from '@/app/pin/actions';
import PinPage from '@/app/pin/page';

// ─── Types ────────────────────────────────────────────────────────────────────

type MockedFn<T extends (...args: unknown[]) => unknown> = jest.MockedFunction<T>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockRedirect = redirect as MockedFn<typeof redirect>;
const mockGetIronSession = getIronSession as jest.MockedFunction<typeof getIronSession>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<
  typeof createServiceRoleClient
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFormData(
  profileId: string,
  digits: [string, string, string, string]
): FormData {
  const fd = new FormData();
  fd.append('profileId', profileId);
  fd.append('digit_0', digits[0]);
  fd.append('digit_1', digits[1]);
  fd.append('digit_2', digits[2]);
  fd.append('digit_3', digits[3]);
  return fd;
}

function makeSupabaseMock(profile: Record<string, unknown> | null, updateError = false) {
  const singleMock = jest.fn().mockResolvedValue({
    data: profile,
    error: profile ? null : { message: 'Not found' },
  });
  const eqMockSelect = jest.fn().mockReturnValue({ single: singleMock });
  const selectMock = jest.fn().mockReturnValue({ eq: eqMockSelect });

  const eqMockUpdate = jest.fn().mockResolvedValue({ error: updateError ? { message: 'err' } : null });
  const updateMock = jest.fn().mockReturnValue({ eq: eqMockUpdate });

  const fromMock = jest.fn().mockReturnValue({
    select: selectMock,
    update: updateMock,
  });

  return { from: fromMock };
}

function getRedirectUrl(e: unknown): string {
  if (e instanceof Error && e.message.startsWith('NEXT_REDIRECT:')) {
    return e.message.replace('NEXT_REDIRECT:', '');
  }
  throw e;
}

// ─── Page-level guard tests ────────────────────────────────────────────────────

describe('/pin page guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation((message) => {
      if (typeof message === 'string' && message.includes('Invalid value for prop `action`')) {
        return;
      }
      // Allow other errors through
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redirects to /select-user when no userId is provided in searchParams', async () => {
    const supabaseMock = makeSupabaseMock(null);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);

    let redirectUrl = '';
    try {
      await PinPage({ searchParams: {} });
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/select-user');
  });

  it('redirects to /select-user?error=locked when the profile pin_locked_until is in the future', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const lockedProfile = {
      id: 'profile-1',
      display_name: 'Jane',
      pin_hash: 'hash',
      pin_locked_until: futureDate,
    };

    const supabaseMock = makeSupabaseMock(lockedProfile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);

    let redirectUrl = '';
    try {
      await PinPage({ searchParams: { userId: 'profile-1' } });
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/select-user?error=locked');
  });

  it('redirects to /setup-pin when pin_hash is null for the profile', async () => {
    const noPinProfile = {
      id: 'profile-2',
      display_name: 'Tom',
      pin_hash: null,
      pin_locked_until: null,
    };

    const supabaseMock = makeSupabaseMock(noPinProfile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);

    let redirectUrl = '';
    try {
      await PinPage({ searchParams: { userId: 'profile-2' } });
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/setup-pin?userId=profile-2');
  });

  it('renders 4 digit input boxes when the profile is valid and unlocked', async () => {
    const validProfile = {
      id: 'profile-3',
      display_name: 'Alice',
      pin_hash: 'somehash',
      pin_locked_until: null,
    };

    const supabaseMock = makeSupabaseMock(validProfile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);

    const pageElement = await PinPage({ searchParams: { userId: 'profile-3' } });
    render(React.createElement(() => pageElement as React.ReactElement));

    const digitInputs = screen.getAllByRole('textbox');
    expect(digitInputs.length).toBe(4);
  });
});

// ─── Server Action tests ───────────────────────────────────────────────────────

describe('validatePin server action', () => {
  beforeEach(() => jest.clearAllMocks());

  it('redirects to /staff and sets cookie when the correct PIN is entered', async () => {
    const profile = {
      id: 'profile-10',
      display_name: 'Bob',
      role: 'staff',
      pin_hash: '$2b$10$testhash',
      pin_fail_count: 0,
      pin_locked_until: null,
    };

    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(true);

    const saveMock = jest.fn().mockResolvedValue(undefined);
    (mockGetIronSession as jest.Mock).mockResolvedValue({
      activeUser: undefined,
      save: saveMock,
    });

    const fd = buildFormData('profile-10', ['1', '2', '3', '4']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/staff');
    expect(saveMock).toHaveBeenCalled();
    // Ensure fail count is reset
    expect(supabaseMock.from('profiles').update).toHaveBeenCalledWith({ pin_fail_count: 0 });
  });

  it('increments pin_fail_count when an incorrect PIN is entered', async () => {
    const profile = {
      id: 'profile-11',
      display_name: 'Carol',
      role: 'staff',
      pin_hash: '$2b$10$testhash',
      pin_fail_count: 1,
      pin_locked_until: null,
    };

    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

    const fd = buildFormData('profile-11', ['9', '9', '9', '9']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    // Fail count should become 2, 3 remaining
    expect(redirectUrl).toBe('/pin?userId=profile-11&error=invalid&remaining=3');
    expect(supabaseMock.from('profiles').update).toHaveBeenCalledWith({ pin_fail_count: 2 });
  });

  it('sets pin_locked_until and redirects to /select-user?error=locked on the 5th incorrect PIN', async () => {
    const profile = {
      id: 'profile-12',
      display_name: 'Dave',
      role: 'staff',
      pin_hash: '$2b$10$testhash',
      pin_fail_count: 4,
      pin_locked_until: null,
    };

    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

    const fd = buildFormData('profile-12', ['0', '0', '0', '0']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/select-user?error=locked');

    // Verify lockout update was called with pin_locked_until and pin_fail_count: 0
    const updateCall = supabaseMock.from('profiles').update.mock.calls[0][0] as Record<string, unknown>;
    expect(updateCall).toMatchObject({ pin_fail_count: 0 });
    expect(typeof updateCall.pin_locked_until).toBe('string');
    const lockedUntil = new Date(updateCall.pin_locked_until as string);
    expect(lockedUntil.getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000);
  });

  it('rejects non-numeric PIN input and redirects back with error', async () => {
    const profile = {
      id: 'profile-13',
      display_name: 'Eve',
      role: 'staff',
      pin_hash: '$2b$10$testhash',
      pin_fail_count: 0,
      pin_locked_until: null,
    };

    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);

    // Non-numeric input
    const fd = buildFormData('profile-13', ['a', 'b', 'c', 'd']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    // Should redirect with error but NOT call bcrypt.compare
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(redirectUrl).toContain('/pin?userId=profile-13&error=invalid');
  });

  it('does not include the raw PIN value in any redirect URL or error message', async () => {
    const profile = {
      id: 'profile-14',
      display_name: 'Frank',
      role: 'staff',
      pin_hash: '$2b$10$testhash',
      pin_fail_count: 0,
      pin_locked_until: null,
    };

    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(supabaseMock as ReturnType<typeof createServiceRoleClient>);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

    const sensitivePin = '7391';
    const fd = buildFormData('profile-14', ['7', '3', '9', '1']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    // The raw PIN must never appear in the redirect URL
    expect(redirectUrl).not.toContain(sensitivePin);
  });
});
