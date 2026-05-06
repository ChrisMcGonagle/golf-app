/**
 * Tests for DashboardSidebar component (PBI-005, PBI-028)
 *
 * Covers: rendering sidebar with navigation links, collapsible Membership submenu, active link styling based on pathname, BaffyBrand component.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/components/BaffyBrand', () => {
  return function DummyBaffyBrand() {
    return <div data-testid="baffy-brand">BaffyBrand</div>;
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

    it('should render BaffyBrand component at the top', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      expect(screen.getByTestId('baffy-brand')).toBeInTheDocument();
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
      
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(pendingLink).toBeInTheDocument();
      expect(memberListLink).toBeInTheDocument();
    });

    it('should not render submenu items initially when Membership is collapsed', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      
      // Membership submenu should be collapsed by default
      const pendingLink = screen.queryByRole('link', { name: /pending/i });
      const memberListLink = screen.queryByRole('link', { name: /member list/i });
      expect(pendingLink).not.toBeInTheDocument();
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

    it('should apply active styling to Pending link when on /dashboard/submissions', () => {
      mockUsePathname.mockReturnValue('/dashboard/submissions');
      const { container } = render(<DashboardSidebar />);
      // Membership should auto-expand if we're on a submenu route
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      // Since Pending is active, membership should be expanded
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      expect(pendingLink).toHaveClass('bg-gray-100', 'font-semibold');
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
      expect(screen.queryByRole('link', { name: /pending/i })).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(membershipButton);
      expect(screen.getByRole('link', { name: /pending/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /member list/i })).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(membershipButton);
      expect(screen.queryByRole('link', { name: /pending/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /member list/i })).not.toBeInTheDocument();
    });

    it('should have correct href for Pending link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      fireEvent.click(membershipButton);
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      expect(pendingLink.getAttribute('href')).toBe('/dashboard/submissions');
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
      const { container } = render(<DashboardSidebar />);
      // Check for icon elements (emojis rendered as text)
      expect(container.textContent).toContain('📊'); // Dashboard icon
      expect(container.textContent).toContain('👤'); // Accounts icon
      expect(container.textContent).toContain('🏌️'); // Membership icon
    });

    it('should have chevron in Membership button', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar />);
      const membershipButton = screen.getByRole('button', { name: /membership/i });
      const svg = membershipButton.querySelector('svg'); // Check for SVG chevron
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
});
