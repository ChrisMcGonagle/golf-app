/**
 * Tests for DashboardSidebar component (PBI-005, PBI-028)
 *
 * Covers: rendering sidebar with navigation links, collapsible Membership submenu, active link styling based on pathname, HickoryBrand component.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/components/HickoryBrand', () => {
  return function DummyHickoryBrand() {
    return <div data-testid="hickory-brand">HICKORY</div>;
  };
});

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardSidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockClear();
  });

  describe('renders navigation structure', () => {
    it('should render an aside element with white background styling', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar />);
      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('w-64', 'min-h-screen', 'bg-white');
      expect(aside?.className).toContain('text-[#2b2b2b]');
    });

    it('should render HickoryBrand component at the top', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      expect(screen.getByTestId('hickory-brand')).toBeInTheDocument();
    });

    it('should NOT render "Admin" heading', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('should render "Dashboard" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should render "Membership" button', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      expect(membershipButton).toBeInTheDocument();
    });

    it('should render "Accounts" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      expect(accountsLink).toBeInTheDocument();
      expect(accountsLink).toHaveAttribute('href', '/dashboard/accounts');
    });

    it('should render submenu items when Membership is expanded', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      fireEvent.click(membershipButton);
      
      const requestsLink = screen.getByRole('link', { name: /requests/i });
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(requestsLink).toBeInTheDocument();
      expect(memberListLink).toBeInTheDocument();
    });

    it('should not render submenu items initially when Membership is collapsed', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      
      // Membership submenu should be collapsed by default
      const requestsLink = screen.queryByRole('link', { name: /requests/i });
      const memberListLink = screen.queryByRole('link', { name: /member list/i });
      expect(requestsLink).not.toBeInTheDocument();
      expect(memberListLink).not.toBeInTheDocument();
    });
  });

  describe('active link styling', () => {
    it('should apply active styling to Dashboard link when on /dashboard', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-gray-100', 'font-semibold');
      // Ensure no green border
      expect(dashboardLink).not.toHaveClass('border-l-4');
    });

    it('should apply active styling to Accounts link when on /dashboard/accounts', () => {
      mockUsePathname.mockReturnValue('/dashboard/accounts');
      render(<DashboardSidebar />);
      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      expect(accountsLink).toHaveClass('bg-gray-100', 'font-semibold');
      expect(accountsLink).not.toHaveClass('border-l-4');
    });

    it('should apply inactive styling to Dashboard link when on different route', () => {
      mockUsePathname.mockReturnValue('/dashboard/accounts');
      render(<DashboardSidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveClass('bg-gray-100');
      expect(dashboardLink).not.toHaveClass('font-semibold');
    });

    it('should apply active styling to Requests link when on /dashboard/requests', () => {
      mockUsePathname.mockReturnValue('/dashboard/requests');
      render(<DashboardSidebar />);
      // Membership should auto-expand if we're on a submenu route
      const requestsLink = screen.getByRole('link', { name: /requests/i });
      expect(requestsLink).toHaveClass('bg-gray-100', 'font-semibold');
      expect(requestsLink).not.toHaveClass('border-amber-200', 'bg-amber-50/80', 'ring-1', 'ring-amber-100');
    });

    it('should apply active styling to Member List link when on /dashboard/members', () => {
      mockUsePathname.mockReturnValue('/dashboard/members');
      render(<DashboardSidebar />);
      // Membership should auto-expand if we're on a submenu route
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(memberListLink).toHaveClass('bg-gray-100', 'font-semibold');
    });
  });

  describe('Membership submenu collapsibility', () => {
    it('should toggle submenu visibility when Membership button is clicked', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });

      // Initially collapsed
      expect(screen.queryByRole('link', { name: /requests/i })).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(membershipButton);
      expect(screen.getByRole('link', { name: /requests/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /member list/i })).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(membershipButton);
      expect(screen.queryByRole('link', { name: /requests/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /member list/i })).not.toBeInTheDocument();
    });

    it('should have correct href for Requests link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      fireEvent.click(membershipButton);
      const requestsLink = screen.getByRole('link', { name: /requests/i });
      expect(requestsLink.getAttribute('href')).toBe('/dashboard/requests');
    });

    it('should have correct href for Member List link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      fireEvent.click(membershipButton);
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(memberListLink.getAttribute('href')).toBe('/dashboard/members');
    });
  });

  describe('styling and design', () => {
    it('should have rounded styling on all links', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const allLinks = screen.getAllByRole('link');
      allLinks.forEach((link) => {
        expect(link).toHaveClass('rounded-lg');
      });
    });

    it('should have icons for Dashboard, Accounts, and Membership', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      const membershipButton = screen.getByRole('button', { name: /membership/i });

      [dashboardLink, accountsLink, membershipButton].forEach((element) => {
        const icon = element.querySelector('svg.h-5.w-5');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('aria-hidden', 'true');
        expect(icon).toHaveAttribute('fill', 'none');
      });
    });

    it('should have chevron in Membership button', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      const svg = membershipButton.querySelector('svg:not(.h-5):not(.w-5)');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 12 8');
    });

    it('should NOT have green border on active links', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveClass('border-[#22c55e]');
      expect(dashboardLink).not.toHaveClass('border-l-4');
    });

    it('should have white background', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar />);
      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('bg-white');
    });
  });

  describe('requests badge', () => {
    it('should not render a badge when the pending request count is 0', () => {
      mockUsePathname.mockReturnValue('/dashboard/requests');
      render(<DashboardSidebar pendingRequestsCount={0} />);

      expect(screen.queryByLabelText(/pending requests/i)).not.toBeInTheDocument();
    });

    it('should render a badge when the pending request count is greater than 0', () => {
      mockUsePathname.mockReturnValue('/dashboard/requests');
      render(<DashboardSidebar pendingRequestsCount={3} />);

      const badge = screen.getByLabelText('3 pending requests');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
      expect(badge).toHaveClass('border', 'border-amber-500', 'bg-amber-500', 'text-white', 'ring-1', 'ring-amber-200');
    });

    it('should keep the active requests row standard while the badge carries the warning emphasis', () => {
      mockUsePathname.mockReturnValue('/dashboard/requests');
      render(<DashboardSidebar pendingRequestsCount={5} />);

      const requestsLink = screen.getByRole('link', { name: /requests/i });
      const badge = screen.getByLabelText('5 pending requests');

      expect(requestsLink).toHaveClass('bg-gray-100', 'font-semibold');
      expect(requestsLink).not.toHaveClass('border-amber-200', 'bg-amber-50/80', 'ring-1', 'ring-amber-100');
      expect(badge).toHaveClass('border-amber-500', 'bg-amber-500', 'text-white');
    });

    it('should keep multi-digit counts readable inside the requests item', () => {
      mockUsePathname.mockReturnValue('/dashboard/requests');
      render(<DashboardSidebar pendingRequestsCount={12} />);

      const badge = screen.getByLabelText('12 pending requests');
      expect(badge).toHaveTextContent('12');
      expect(badge).toHaveClass('min-w-[1.25rem]', 'px-1.5', 'rounded-full');
    });

    it('should keep the same emphasized requests badge when the requests item is not selected', () => {
      mockUsePathname.mockReturnValue('/dashboard/members');
      render(<DashboardSidebar pendingRequestsCount={4} />);

      const badge = screen.getByLabelText('4 pending requests');
      expect(badge).toHaveClass('border', 'border-amber-500', 'bg-amber-500', 'text-white', 'ring-1', 'ring-amber-200');
    });
  });
});
