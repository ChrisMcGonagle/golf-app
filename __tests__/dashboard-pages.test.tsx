/**
 * Tests for Dashboard Pages (PBI-005)
 *
 * Covers: rendering of dashboard main page, submissions page, and members page.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(authenticated)/dashboard/(with-sidebar)/page';
import SubmissionsPage from '@/app/(authenticated)/dashboard/(with-sidebar)/submissions/page';
import MembersPage from '@/app/(authenticated)/dashboard/(with-sidebar)/members/page';

describe('DashboardPage', () => {
  describe('rendering', () => {
    it('should render a heading with "Admin Dashboard" title', () => {
      render(<DashboardPage />);
      expect(screen.getByRole('heading', { level: 1, name: /admin dashboard/i })).toBeInTheDocument();
    });

    it('should render welcome message text', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/welcome to the admin dashboard/i)).toBeInTheDocument();
    });

    it('should render navigation hint text', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/use the sidebar to navigate/i)).toBeInTheDocument();
    });
  });

  describe('stat placeholders', () => {
    it('should render "Total Submissions" stat card', () => {
      render(<DashboardPage />);
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
    });

    it('should render "Total Members" stat card', () => {
      render(<DashboardPage />);
      expect(screen.getByText('Total Members')).toBeInTheDocument();
    });

    it('should display placeholder count of 0 for submissions', () => {
      const { container } = render(<DashboardPage />);
      const stats = screen.getAllByText('0');
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should display placeholder count of 0 for members', () => {
      const { container } = render(<DashboardPage />);
      const stats = screen.getAllByText('0');
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should render stat cards in a grid layout', () => {
      const { container } = render(<DashboardPage />);
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have white background on stat cards', () => {
      const { container } = render(<DashboardPage />);
      const cards = container.querySelectorAll('[class*="bg-white"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('styling', () => {
    it('should have large heading with proper sizing', () => {
      render(<DashboardPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /admin dashboard/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });

    it('should display heading in dark gray', () => {
      render(<DashboardPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /admin dashboard/i });
      expect(heading).toHaveClass('text-gray-900');
    });

    it('should have spacing between heading and welcome text', () => {
      render(<DashboardPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /admin dashboard/i });
      expect(heading).toHaveClass('mb-4');
    });
  });
});

describe('SubmissionsPage', () => {
  describe('rendering', () => {
    it('should render a heading with "Submissions" title', () => {
      render(<SubmissionsPage />);
      expect(screen.getByRole('heading', { level: 1, name: /submissions/i })).toBeInTheDocument();
    });

    it('should render placeholder text', () => {
      render(<SubmissionsPage />);
      expect(screen.getByText(/submissions content coming soon/i)).toBeInTheDocument();
    });

    it('should have proper page structure', () => {
      const { container } = render(<SubmissionsPage />);
      const div = container.firstChild;
      expect(div).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should render heading with correct size and color', () => {
      render(<SubmissionsPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /submissions/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
    });

    it('should have placeholder text in gray color', () => {
      render(<SubmissionsPage />);
      const placeholder = screen.getByText(/submissions content coming soon/i);
      expect(placeholder).toHaveClass('text-gray-600');
    });

    it('should have spacing between heading and text', () => {
      render(<SubmissionsPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /submissions/i });
      expect(heading).toHaveClass('mb-4');
    });
  });
});

describe('MembersPage', () => {
  describe('rendering', () => {
    it('should render a heading with "Members" title', () => {
      render(<MembersPage />);
      expect(screen.getByRole('heading', { level: 1, name: /members/i })).toBeInTheDocument();
    });

    it('should render placeholder text', () => {
      render(<MembersPage />);
      expect(screen.getByText(/members content coming soon/i)).toBeInTheDocument();
    });

    it('should have proper page structure', () => {
      const { container } = render(<MembersPage />);
      const div = container.firstChild;
      expect(div).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should render heading with correct size and color', () => {
      render(<MembersPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /members/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
    });

    it('should have placeholder text in gray color', () => {
      render(<MembersPage />);
      const placeholder = screen.getByText(/members content coming soon/i);
      expect(placeholder).toHaveClass('text-gray-600');
    });

    it('should have spacing between heading and text', () => {
      render(<MembersPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /members/i });
      expect(heading).toHaveClass('mb-4');
    });
  });
});
