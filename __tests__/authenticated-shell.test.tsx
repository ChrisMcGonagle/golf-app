jest.mock('@/components/InactivityProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthenticatedShell from '@/components/AuthenticatedShell';

describe('AuthenticatedShell', () => {
  it.each([
    '/dashboard/membership-flow',
    '/dashboard/membership-flow/next',
    '/dashboard/membership/type',
    '/dashboard/membership/form',
    '/dashboard/membership-registration',
  ])('renders children on membership flow screen %s', () => {
    render(
      <AuthenticatedShell>
        <div>Membership Content</div>
      </AuthenticatedShell>
    );

    expect(screen.getByText('Membership Content')).toBeInTheDocument();
  });

  it.each(['/dashboard'])(
    'renders children on non-flow screen %s',
    () => {
      render(
        <AuthenticatedShell>
          <div>Dashboard Content</div>
        </AuthenticatedShell>
      );

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    }
  );
});