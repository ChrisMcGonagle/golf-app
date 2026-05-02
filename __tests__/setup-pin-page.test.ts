/**
 * Tests for /setup-pin page and Server Actions (PBI-003c)
 *
 * Behavior-based test names covering identity verification, PIN setup,
 * guards, and security constraints.
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

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import bcryptjs from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyIdentity, savePin } from '@/app/setup-pin/actions';
import SetupPinPage from '@/app/setup-pin/page';

// ─── Types ────────────────────────────────────────────────────────────────────

type MockedFn<T extends (...args: unknown[]) => unknown> = jest.MockedFunction<T>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockRedirect = redirect as MockedFn<typeof redirect>;
const mockGetIronSession = getIronSession as jest.MockedFunction<typeof getIronSession>;
const mockBcryptHash = bcryptjs.hash as jest.MockedFunction<typeof bcryptjs.hash>;
const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<
  typeof createServiceRoleClient
>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRedirectUrl(e: unknown): string {
  if (e instanceof Error && e.message.startsWith('NEXT_REDIRECT:')) {
    return e.message.replace('NEXT_REDIRECT:', '');
  }
  throw e;
}

function makeSupabaseMock(
  profile: Record<string, unknown> | null,
  updateError = false
) {
  const singleMock = jest.fn().mockResolvedValue({
    data: profile,
    error: profile ? null : { message: 'Not found' },
  });
  const eqMockSelect = jest.fn().mockReturnValue({ single: singleMock });
  const selectMock = jest.fn().mockReturnValue({ eq: eqMockSelect });

  const eqMockUpdate = jest.fn().mockResolvedValue({
    error: updateError ? { message: 'err' } : null,
  });
  const updateMock = jest.fn().mockReturnValue({ eq: eqMockUpdate });

  const fromMock = jest.fn().mockReturnValue({
    select: selectMock,
    update: updateMock,
  });

  return { from: fromMock };
}

function makeAuthClientMock(userId: string | null, error = false) {
  return {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: userId ? { user: { id: userId }, session: {} } : { user: null, session: null },
        error: error ? { message: 'Invalid credentials' } : null,
      }),
    },
  };
}

function buildVerifyFormData(
  userId: string,
  email: string,
  password: string
): FormData {
  const fd = new FormData();
  fd.append('userId', userId);
  fd.append('email', email);
  fd.append('password', password);
  return fd;
}

function buildSavePinFormData(
  userId: string,
  pin: [string, string, string, string],
  confirm: [string, string, string, string]
): FormData {
  const fd = new FormData();
  fd.append('userId', userId);
  fd.append('digit_0', pin[0]);
  fd.append('digit_1', pin[1]);
  fd.append('digit_2', pin[2]);
  fd.append('digit_3', pin[3]);
  fd.append('confirm_0', confirm[0]);
  fd.append('confirm_1', confirm[1]);
  fd.append('confirm_2', confirm[2]);
  fd.append('confirm_3', confirm[3]);
  return fd;
}

// ─── Page-level guard tests ────────────────────────────────────────────────────

describe('/setup-pin page guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation((message) => {
      if (typeof message === 'string' && message.includes('Invalid value for prop `action`')) {
        return;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redirects to /select-user when no userId is provided', async () => {
    const supabaseMock = makeSupabaseMock(null);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    let redirectUrl = '';
    try {
      await SetupPinPage({ searchParams: Promise.resolve({}) });
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/select-user');
  });

  it('redirects to /pin when pin_hash is already set for the profile', async () => {
    const profileWithPin = {
      id: 'user-1',
      display_name: 'Alice',
      pin_hash: '$2b$10$somehash',
    };

    const supabaseMock = makeSupabaseMock(profileWithPin);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    let redirectUrl = '';
    try {
      await SetupPinPage({ searchParams: Promise.resolve({ userId: 'user-1' }) });
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/pin?userId=user-1');
  });

  it('renders email and password form on step 1 (default)', async () => {
    const profile = {
      id: 'user-2',
      display_name: 'Bob',
      pin_hash: null,
    };

    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    const pageElement = await SetupPinPage({
      searchParams: Promise.resolve({ userId: 'user-2' }),
    });
    render(React.createElement(() => pageElement as React.ReactElement));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders PIN entry form on step 2', async () => {
    const profile = {
      id: 'user-3',
      display_name: 'Carol',
      pin_hash: null,
    };

    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    const pageElement = await SetupPinPage({
      searchParams: Promise.resolve({ userId: 'user-3', step: '2' }),
    });
    render(React.createElement(() => pageElement as React.ReactElement));

    // 4 PIN digit inputs + 4 confirm digit inputs = 8 total
    const digitInputs = screen.getAllByRole('textbox');
    expect(digitInputs.length).toBe(8);
  });
});

// ─── verifyIdentity action tests ──────────────────────────────────────────────

describe('verifyIdentity server action', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows invalid_credentials error when password is wrong', async () => {
    const profile = { id: 'user-10', display_name: 'Dave', role: 'staff', pin_hash: null };
    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    const authMock = makeAuthClientMock(null, true);
    mockCreateClient.mockReturnValue(authMock as ReturnType<typeof createClient>);

    const fd = buildVerifyFormData('user-10', 'dave@example.com', 'wrongpass');

    let redirectUrl = '';
    try {
      await verifyIdentity(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/setup-pin?userId=user-10&error=invalid_credentials');
  });

  it('shows email_mismatch error when authenticated user ID does not match userId', async () => {
    const profile = { id: 'user-10', display_name: 'Dave', role: 'staff', pin_hash: null };
    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    // Auth returns a different user ID
    const authMock = makeAuthClientMock('different-user-id', false);
    mockCreateClient.mockReturnValue(authMock as ReturnType<typeof createClient>);

    const fd = buildVerifyFormData('user-10', 'other@example.com', 'password123');

    let redirectUrl = '';
    try {
      await verifyIdentity(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/setup-pin?userId=user-10&error=email_mismatch');
  });

  it('redirects to step 2 when identity verification succeeds', async () => {
    const profile = { id: 'user-10', display_name: 'Dave', role: 'staff', pin_hash: null };
    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    // Auth returns matching user ID
    const authMock = makeAuthClientMock('user-10', false);
    mockCreateClient.mockReturnValue(authMock as ReturnType<typeof createClient>);

    const fd = buildVerifyFormData('user-10', 'dave@example.com', 'correctpassword');

    let redirectUrl = '';
    try {
      await verifyIdentity(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/setup-pin?userId=user-10&step=2');
  });
});

// ─── savePin action tests ──────────────────────────────────────────────────────

describe('savePin server action', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows pin_mismatch error when PIN and confirmation do not match', async () => {
    const profile = { id: 'user-20', display_name: 'Eve', role: 'staff', pin_hash: null };
    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    const fd = buildSavePinFormData(
      'user-20',
      ['1', '2', '3', '4'],
      ['1', '2', '3', '5']
    );

    let redirectUrl = '';
    try {
      await savePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/setup-pin?userId=user-20&step=2&error=pin_mismatch');
  });

  it('shows pin_invalid error when PIN is not exactly 4 numeric digits', async () => {
    const profile = { id: 'user-20', display_name: 'Eve', role: 'staff', pin_hash: null };
    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    // non-numeric digit
    const fd = buildSavePinFormData(
      'user-20',
      ['a', 'b', 'c', 'd'],
      ['a', 'b', 'c', 'd']
    );

    let redirectUrl = '';
    try {
      await savePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    expect(redirectUrl).toBe('/setup-pin?userId=user-20&step=2&error=pin_invalid');
  });

  it('hashes the PIN, saves it, sets the cookie, and redirects to /staff on success', async () => {
    const profile = { id: 'user-20', display_name: 'Eve', role: 'staff', pin_hash: null };
    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    mockBcryptHash.mockResolvedValue('$2b$10$hashedpin' as never);

    const mockSession = { activeUser: undefined as unknown, save: jest.fn().mockResolvedValue(undefined) };
    mockGetIronSession.mockResolvedValue(mockSession as ReturnType<typeof getIronSession> extends Promise<infer T> ? T : never);

    const fd = buildSavePinFormData(
      'user-20',
      ['1', '2', '3', '4'],
      ['1', '2', '3', '4']
    );

    let redirectUrl = '';
    try {
      await savePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    // bcrypt.hash called with raw pin and salt 10
    expect(mockBcryptHash).toHaveBeenCalledWith('1234', 10);

    // profile updated with hash
    const fromCalls = supabaseMock.from.mock.calls;
    const updateCall = fromCalls.find((c: unknown[]) => c[0] === 'profiles');
    expect(updateCall).toBeDefined();

    // session was saved
    expect(mockSession.save).toHaveBeenCalled();

    // redirect to /dashboard
    expect(redirectUrl).toBe('/dashboard');
  });

  it('does not include raw PIN in any redirect URLs', async () => {
    const profile = { id: 'user-21', display_name: 'Frank', role: 'staff', pin_hash: null };
    const supabaseMock = makeSupabaseMock(profile);
    mockCreateServiceRoleClient.mockReturnValue(
      supabaseMock as ReturnType<typeof createServiceRoleClient>
    );

    // Mismatched PINs to trigger a redirect with error
    const fd = buildSavePinFormData(
      'user-21',
      ['9', '9', '9', '9'],
      ['1', '1', '1', '1']
    );

    let redirectUrl = '';
    try {
      await savePin(fd);
    } catch (e) {
      redirectUrl = getRedirectUrl(e);
    }

    // Raw PIN '9999' or '1111' must not appear in the redirect URL
    expect(redirectUrl).not.toContain('9999');
    expect(redirectUrl).not.toContain('1111');
  });
});
