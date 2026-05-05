const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock('@/components/InactivityProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/SignOffButton', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <button className={className} type="button">
      Sign Off
    </button>
  ),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthenticatedShell from '@/components/AuthenticatedShell';

describe('AuthenticatedShell', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it.each([
    '/dashboard/membership-flow',
    '/dashboard/membership-flow/next',
    '/dashboard/membership/type',
    '/dashboard/membership/form',
    '/dashboard/membership-registration',
  ])('renders children on membership flow screen %s', (pathname) => {
    mockUsePathname.mockReturnValue(pathname);

    render(
      <AuthenticatedShell>
        <div>Membership Content</div>
      </AuthenticatedShell>
    );

    expect(screen.getByText('Membership Content')).toBeInTheDocument();
  });

  it.each(['/dashboard'])(
    'renders children on non-flow screen %s',
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname);

      render(
        <AuthenticatedShell>
          <div>Dashboard Content</div>
        </AuthenticatedShell>
      );

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    }
  );
});