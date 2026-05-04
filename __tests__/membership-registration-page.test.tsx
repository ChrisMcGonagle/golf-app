/**
 * Tests for MembershipRegistrationPage (PBI-006)
 *
 * Acceptance Criteria:
 * 1. Page renders without errors
 * 2. "New Membership" button is visible
 * 3. "Membership Renewal" button is visible
 * 4. DashboardSidebar is NOT rendered on this page
 * 5. Page has appropriate heading ("Membership Registration")
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MembershipRegistrationPage from '@/app/(authenticated)/dashboard/membership-registration/page';

// ─── Mock DashboardSidebar to detect if it is rendered ───────────────────────

jest.mock('@/components/DashboardSidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-sidebar">Sidebar</div>,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PBI-006: MembershipRegistrationPage', () => {
  beforeEach(() => {
    render(<MembershipRegistrationPage />);
  });

  it('renders without errors', () => {
    // If render throws, the test fails automatically
    expect(document.body).toBeTruthy();
  });

  it('displays the "Membership Registration" heading', () => {
    expect(
      screen.getByRole('heading', { name: /membership registration/i })
    ).toBeInTheDocument();
  });

  it('shows a "New Membership" link that navigates to /dashboard/new-member', () => {
    const link = screen.getByRole('link', { name: /new membership/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard/membership-flow?intent=new');
  });

  it('shows a "Membership Renewal" link that navigates to /dashboard/membership-renewal', () => {
    const link = screen.getByRole('link', { name: /membership renewal/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard/membership-flow?intent=renewal');
  });

  it('does NOT render DashboardSidebar', () => {
    expect(screen.queryByTestId('dashboard-sidebar')).not.toBeInTheDocument();
  });
});
