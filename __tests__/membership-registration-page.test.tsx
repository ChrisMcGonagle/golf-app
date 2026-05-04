/**
 * Tests for MembershipRegistrationPage (PBI-006, updated for PBI-018)
 *
 * Acceptance Criteria:
 * 1. Page renders without errors
 * 2. "New Member" link is visible
 * 3. "Membership Renewal" link is visible
 * 4. DashboardSidebar is NOT rendered on this page
 * 5. Page has the updated heading stack ("Choose a" + "Membership")
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

  it('displays the updated heading stack', () => {
    expect(screen.getByText(/choose a/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^membership$/i })).toBeInTheDocument();
  });

  it('shows a "New Member" link that navigates to /dashboard/membership-flow?intent=new', () => {
    const link = screen.getByRole('link', { name: /new member/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard/membership-flow?intent=new');
  });

  it('shows a "Membership Renewal" link that navigates to /dashboard/membership-flow?intent=renewal', () => {
    const link = screen.getByRole('link', { name: /membership renewal/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard/membership-flow?intent=renewal');
  });

  it('does NOT render DashboardSidebar', () => {
    expect(screen.queryByTestId('dashboard-sidebar')).not.toBeInTheDocument();
  });
});
