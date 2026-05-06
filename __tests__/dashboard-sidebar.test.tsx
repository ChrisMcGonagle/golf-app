/**
 * Tests for DashboardSidebar component (PBI-005, PBI-028)
 *
 * Covers: rendering sidebar with navigation links, active link styling based on pathname, BaffyBrand component.
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
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardSidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockClear();
  });

  describe('renders navigation structure', () => {
    it('should render an aside element with light background styling', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar />);
      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('w-64', 'min-h-screen');
      // Custom background colour applied via bg-[#f5f6f5]
      expect(aside?.className).toContain('bg-[#f5f6f5]');
      expect(aside?.className).toContain('text-[#2b2b2b]');
    });

    it('should render BaffyBrand component at the top', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      expect(screen.getByTestId('baffy-brand')).toBeInTheDocument();
    });

    it('should render "Admin" heading', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should render "Dashboard" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should render "Pending" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      expect(pendingLink).toBeInTheDocument();
      expect(pendingLink).toHaveAttribute('href', '/dashboard/submissions');
    });

    it('should render "Member List" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(memberListLink).toBeInTheDocument();
      expect(memberListLink).toHaveAttribute('href', '/dashboard/members');
    });

    it('should render "Accounts" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      expect(accountsLink).toBeInTheDocument();
      expect(accountsLink).toHaveAttribute('href', '/dashboard/accounts');
    });
  });

  describe('active link styling', () => {
    it('should apply active styling to Pending link when on /dashboard/submissions', () => {
      mockUsePathname.mockReturnValue('/dashboard/submissions');
      render(<DashboardSidebar />);
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      expect(pendingLink).toHaveClass('bg-gray-100', 'font-semibold', 'border-l-4');
    });

    it('should apply active styling to Member List link when on /dashboard/members', () => {
      mockUsePathname.mockReturnValue('/dashboard/members');
      render(<DashboardSidebar />);
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(memberListLink).toHaveClass('bg-gray-100', 'font-semibold', 'border-l-4');
    });

    it('should apply inactive styling to Pending when on different route', () => {
      mockUsePathname.mockReturnValue('/dashboard/members');
      render(<DashboardSidebar />);
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      expect(pendingLink).not.toHaveClass('bg-gray-100');
      expect(pendingLink).not.toHaveClass('font-semibold');
    });

    it('should apply inactive styling to Member List when on different route', () => {
      mockUsePathname.mockReturnValue('/dashboard/submissions');
      render(<DashboardSidebar />);
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(memberListLink).not.toHaveClass('bg-gray-100');
      expect(memberListLink).not.toHaveClass('font-semibold');
    });

    it('should apply active styling to Dashboard link when on /dashboard', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const dashboardLink = screen.getByRole('link', { name: /^dashboard$/i });
      expect(dashboardLink).toHaveClass('bg-gray-100', 'font-semibold', 'border-l-4');
      // Other links should not be active
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      expect(pendingLink).not.toHaveClass('bg-gray-100');
      expect(memberListLink).not.toHaveClass('bg-gray-100');
      expect(accountsLink).not.toHaveClass('bg-gray-100');
    });

    it('should apply active styling to Accounts link when on /dashboard/accounts', () => {
      mockUsePathname.mockReturnValue('/dashboard/accounts');
      render(<DashboardSidebar />);
      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      expect(accountsLink).toHaveClass('bg-gray-100', 'font-semibold', 'border-l-4');
    });
  });

  describe('link navigation', () => {
    it('should have correct href for Dashboard link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const dashboardLink = screen.getByRole('link', { name: /^dashboard$/i });
      expect(dashboardLink.getAttribute('href')).toBe('/dashboard');
    });

    it('should have correct href for Pending link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const pendingLink = screen.getByRole('link', { name: /pending/i });
      expect(pendingLink.getAttribute('href')).toBe('/dashboard/submissions');
    });

    it('should have correct href for Member List link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const memberListLink = screen.getByRole('link', { name: /member list/i });
      expect(memberListLink.getAttribute('href')).toBe('/dashboard/members');
    });

    it('should have correct href for Accounts link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const accountsLink = screen.getByRole('link', { name: /accounts/i });
      expect(accountsLink.getAttribute('href')).toBe('/dashboard/accounts');
    });

    it('should have rounded styling on all links', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const allLinks = screen.getAllByRole('link');
      allLinks.forEach((link) => {
        expect(link).toHaveClass('rounded-lg');
      });
    });
  });
});
