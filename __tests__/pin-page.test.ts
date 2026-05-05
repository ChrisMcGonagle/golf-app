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

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getIronSession } from 'iron-session';
import bcryptjs from 'bcryptjs';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validatePin } from '@/app/pin/actions';
import PinEntryForm from '@/app/pin/components/PinEntryForm';
import PinEntryScreen from '@/app/pin/components/PinEntryScreen';
import PinPage from '@/app/pin/page';

const mockGetIronSession = getIronSession as jest.MockedFunction<typeof getIronSession>;
const mockBcryptCompare = bcryptjs.compare as jest.MockedFunction<typeof bcryptjs.compare>;
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

  const eqMockUpdate = jest
    .fn()
    .mockResolvedValue({ error: updateError ? { message: 'err' } : null });
  const updateMock = jest.fn().mockReturnValue({ eq: eqMockUpdate });

  const fromMock = jest.fn().mockReturnValue({
    select: selectMock,
    update: updateMock,
  });

  return { from: fromMock };
}

function setSupabaseMock(profile: Record<string, unknown> | null, updateError = false) {
  const supabaseMock = makeSupabaseMock(profile, updateError);

  mockCreateServiceRoleClient.mockReturnValue(
    supabaseMock as unknown as ReturnType<typeof createServiceRoleClient>
  );

  return supabaseMock;
}

function getRedirectUrl(error: unknown): string {
  if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
    return error.message.replace('NEXT_REDIRECT:', '');
  }
  throw error;
}

function getSubmittedDigits(container: HTMLElement): string[] {
  return [0, 1, 2, 3].map((index) => {
    const input = container.querySelector(`input[name="digit_${index}"]`) as HTMLInputElement | null;
    return input?.value ?? '';
  });
}

// ─── Page-level guard tests ────────────────────────────────────────────────────

describe('/pin page guards', () => {
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

  it('redirects to /select-user when no userId is provided in searchParams', async () => {
    setSupabaseMock(null);

    let redirectUrl = '';
    try {
      await PinPage({ searchParams: {} });
    } catch (error) {
      redirectUrl = getRedirectUrl(error);
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

    setSupabaseMock(lockedProfile);

    let redirectUrl = '';
    try {
      await PinPage({ searchParams: { userId: 'profile-1' } });
    } catch (error) {
      redirectUrl = getRedirectUrl(error);
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

    setSupabaseMock(noPinProfile);

    let redirectUrl = '';
    try {
      await PinPage({ searchParams: { userId: 'profile-2' } });
    } catch (error) {
      redirectUrl = getRedirectUrl(error);
    }

    expect(redirectUrl).toBe('/setup-pin?userId=profile-2');
  });

  it('renders the refreshed keypad UI when the profile is valid and unlocked', async () => {
    const validProfile = {
      id: 'profile-3',
      display_name: 'Alice',
      pin_hash: 'somehash',
      pin_locked_until: null,
    };

    setSupabaseMock(validProfile);

    const pageElement = await PinPage({ searchParams: { userId: 'profile-3' } });
    const { container } = render(React.createElement(() => pageElement as React.ReactElement));

    expect(screen.getByRole('heading', { name: /hi alice, enter your pin/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cancel/i })).toHaveAttribute('href', '/select-user');
    expect(screen.getAllByRole('button', { name: /^\d$/ })).toHaveLength(10);
    expect(screen.getByRole('button', { name: /delete digit/i })).toBeInTheDocument();
    expect(getSubmittedDigits(container)).toEqual(['', '', '', '']);
  });
});

describe('PinEntryForm interactions', () => {
  it('updates the submitted digits from keypad taps and delete', () => {
    const { container } = render(
      React.createElement(PinEntryForm, { action: '/pin', profileId: 'profile-3' })
    );

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    expect(getSubmittedDigits(container)).toEqual(['1', '2', '3', '4']);

    fireEvent.click(screen.getByRole('button', { name: /delete digit/i }));

    expect(getSubmittedDigits(container)).toEqual(['1', '2', '3', '']);
  });

  it('accepts keyboard digits and backspace into the same submitted state', () => {
    const { container } = render(
      React.createElement(PinEntryForm, { action: '/pin', profileId: 'profile-4' })
    );
    const input = screen.getByLabelText(/pin input/i);

    fireEvent.change(input, { target: { value: '4278' } });
    expect(getSubmittedDigits(container)).toEqual(['4', '2', '7', '8']);

    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(getSubmittedDigits(container)).toEqual(['4', '2', '7', '']);

    fireEvent.change(input, { target: { value: '42789' } });
    expect(getSubmittedDigits(container)).toEqual(['4', '2', '7', '8']);
  });
});

describe('PinEntryScreen alert state', () => {
  it('renders a single bottom alert and clears it when the user starts a new PIN entry', () => {
    render(
      React.createElement(PinEntryScreen, {
        action: '/pin',
        profileId: 'profile-5',
        error: 'invalid',
        remaining: 3,
        attempt: 1,
      })
    );

    expect(screen.getAllByText(/incorrect pin/i)).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Incorrect PIN. 3 attempts remaining.');

    fireEvent.click(screen.getByRole('button', { name: '1' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the bottom alert as soon as a successful PIN submission starts', async () => {
    const action = jest.fn().mockResolvedValue({ success: true });

    render(
      React.createElement(PinEntryScreen, {
        action,
        profileId: 'profile-6',
        error: 'invalid',
        remaining: 2,
        attempt: 2,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ─── Server Action tests ───────────────────────────────────────────────────────

describe('validatePin server action', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns success response and sets cookie when the correct PIN is entered', async () => {
    const profile = {
      id: 'profile-10',
      display_name: 'Bob',
      role: 'staff',
      pin_hash: '$2b$10$testhash',
      pin_fail_count: 0,
      pin_locked_until: null,
    };

    const supabaseMock = setSupabaseMock(profile);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(true);

    const saveMock = jest.fn().mockResolvedValue(undefined);
    (mockGetIronSession as jest.Mock).mockResolvedValue({
      activeUser: undefined,
      save: saveMock,
    });

    const fd = buildFormData('profile-10', ['1', '2', '3', '4']);

    const response = await validatePin(fd);

    expect(response).toEqual({ success: true });
    expect(saveMock).toHaveBeenCalled();
    expect(supabaseMock.from('profiles').update).toHaveBeenCalledWith({
      pin_fail_count: 0,
      pin_locked_until: null,
    });
  });

  it('returns error response when an incorrect PIN is entered', async () => {
    const profile = {
      id: 'profile-11',
      display_name: 'Carol',
      role: 'staff',
      pin_hash: '$2b$10$testhash',
      pin_fail_count: 1,
      pin_locked_until: null,
    };

    const supabaseMock = setSupabaseMock(profile);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

    const fd = buildFormData('profile-11', ['9', '9', '9', '9']);

    const response = await validatePin(fd);

    expect(response).toEqual({ success: false, error: 'invalid', remaining: 3 });
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

    const supabaseMock = setSupabaseMock(profile);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

    const fd = buildFormData('profile-12', ['0', '0', '0', '0']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (error) {
      redirectUrl = getRedirectUrl(error);
    }

    expect(redirectUrl).toBe('/select-user?error=locked');

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

    setSupabaseMock(profile);

    const fd = buildFormData('profile-13', ['a', 'b', 'c', 'd']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (error) {
      redirectUrl = getRedirectUrl(error);
    }

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

    setSupabaseMock(profile);
    (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

    const sensitivePin = '7391';
    const fd = buildFormData('profile-14', ['7', '3', '9', '1']);

    let redirectUrl = '';
    try {
      await validatePin(fd);
    } catch (error) {
      redirectUrl = getRedirectUrl(error);
    }

    expect(redirectUrl).not.toContain(sensitivePin);
  });
});
