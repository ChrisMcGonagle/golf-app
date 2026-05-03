/**
 * Tests for DashboardSidebar component (PBI-005)
 *
 * Covers: rendering sidebar with navigation links, active link styling based on pathname.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

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
    it('should render an aside element with dark background styling', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar />);
      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('w-64', 'bg-gray-900', 'text-white', 'min-h-screen');
    });

    it('should render "Admin" heading', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should render "Submissions" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const submissionsLink = screen.getByRole('link', { name: /submissions/i });
      expect(submissionsLink).toBeInTheDocument();
      expect(submissionsLink).toHaveAttribute('href', '/dashboard/submissions');
    });

    it('should render "Members" link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membersLink = screen.getByRole('link', { name: /members/i });
      expect(membersLink).toBeInTheDocument();
      expect(membersLink).toHaveAttribute('href', '/dashboard/members');
    });
  });

  describe('active link styling', () => {
    it('should apply active styling to Submissions link when on /dashboard/submissions', () => {
      mockUsePathname.mockReturnValue('/dashboard/submissions');
      render(<DashboardSidebar />);
      const submissionsLink = screen.getByRole('link', { name: /submissions/i });
      expect(submissionsLink).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should apply active styling to Members link when on /dashboard/members', () => {
      mockUsePathname.mockReturnValue('/dashboard/members');
      render(<DashboardSidebar />);
      const membersLink = screen.getByRole('link', { name: /members/i });
      expect(membersLink).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should apply inactive styling to Submissions when on different route', () => {
      mockUsePathname.mockReturnValue('/dashboard/members');
      render(<DashboardSidebar />);
      const submissionsLink = screen.getByRole('link', { name: /submissions/i });
      expect(submissionsLink).toHaveClass('text-gray-300');
      expect(submissionsLink).not.toHaveClass('bg-blue-600');
    });

    it('should apply inactive styling to Members when on different route', () => {
      mockUsePathname.mockReturnValue('/dashboard/submissions');
      render(<DashboardSidebar />);
      const membersLink = screen.getByRole('link', { name: /members/i });
      expect(membersLink).toHaveClass('text-gray-300');
      expect(membersLink).not.toHaveClass('bg-blue-600');
    });

    it('should not highlight any link when on /dashboard (main dashboard page)', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const submissionsLink = screen.getByRole('link', { name: /submissions/i });
      const membersLink = screen.getByRole('link', { name: /members/i });
      expect(submissionsLink).toHaveClass('text-gray-300');
      expect(membersLink).toHaveClass('text-gray-300');
    });
  });

  describe('link navigation', () => {
    it('should have correct href for Submissions link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const submissionsLink = screen.getByRole('link', { name: /submissions/i });
      expect(submissionsLink.getAttribute('href')).toBe('/dashboard/submissions');
    });

    it('should have correct href for Members link', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const membersLink = screen.getByRole('link', { name: /members/i });
      expect(membersLink.getAttribute('href')).toBe('/dashboard/members');
    });

    it('should have rounded styling on links', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      render(<DashboardSidebar />);
      const submissionsLink = screen.getByRole('link', { name: /submissions/i });
      const membersLink = screen.getByRole('link', { name: /members/i });
      expect(submissionsLink).toHaveClass('rounded');
      expect(membersLink).toHaveClass('rounded');
    });
  });
});
