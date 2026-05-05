jest.mock('next/navigation', () => ({
  redirect: jest.fn((u) => { throw new Error('NEXT_REDIRECT:' + u); }),
}));

jest.mock('@/lib/auth/activeUserSession', () => ({
  getActiveUserSession: jest.fn(),
}));

const formProviderSpy = jest.fn();

jest.mock('@/components/contexts/FormContext', () => ({
  FormProvider: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    formProviderSpy(props);
    return <div data-testid="form-provider">{children}</div>;
  },
}));

jest.mock('@/app/(authenticated)/dashboard/membership/form/components/FormShell', () => ({
  __esModule: true,
  default: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="form-shell">Step {currentStep}</div>
  ),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { getActiveUserSession } from '@/lib/auth/activeUserSession';
import MembershipFormPage from '@/app/(authenticated)/dashboard/membership/form/page';

const mockGetActiveUserSession = jest.mocked(getActiveUserSession);
const mockOperator = {
  profileId: 'staff-123',
  displayName: 'Alex Operator',
  role: 'staff',
  expiresAt: Date.now() + 60_000,
};

describe('MembershipFormPage operator attribution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveUserSession.mockResolvedValue(mockOperator);
  });

  it('passes the active operator into the form provider flow', async () => {
    render(
      await MembershipFormPage({
        searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member', step: '2' }),
      })
    );

    expect(screen.getByTestId('form-shell')).toHaveTextContent('Step 2');
    expect(formProviderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'new',
        typeId: 'Full Member',
        operator: mockOperator,
      })
    );
  });

  it('fails closed when the active operator session is unavailable', async () => {
    mockGetActiveUserSession.mockResolvedValueOnce(null);

    await expect(
      MembershipFormPage({
        searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT:/select-user');
  });
});