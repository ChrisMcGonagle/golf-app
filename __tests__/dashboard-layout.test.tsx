/**
 * Tests for DashboardLayout component (PBI-005)
 *
 * Covers: layout structure with sidebar and main content area, children rendering.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '@/app/(authenticated)/dashboard/layout';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardLayout', () => {
  describe('renders layout structure', () => {
    it('should render a flex container with sidebar and main content', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const flexContainer = container.querySelector('div[class*="flex"]');
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toHaveClass('flex', 'min-h-screen', 'bg-gray-50');
    });

    it('should render DashboardSidebar component', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('bg-gray-900', 'text-white');
    });

    it('should render main content area to the right of sidebar', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('flex-1', 'p-8');
    });

    it('should render children inside main content area', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have flex layout that positions sidebar on left', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const flexContainer = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(flexContainer);
      // Flex containers have display: flex
      expect(flexContainer.className).toMatch(/flex/);
    });

    it('should have sidebar with fixed width', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('w-64');
    });

    it('should have main content area that grows to fill remaining space', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('flex-1');
    });

    it('should maintain min-h-screen for full viewport height', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const flexContainer = container.firstChild;
      expect(flexContainer).toHaveClass('min-h-screen');
    });
  });

  describe('children rendering', () => {
    it('should render simple text content', () => {
      render(
        <DashboardLayout>
          <span>Hello World</span>
        </DashboardLayout>
      );

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render complex component children', () => {
      const TestComponent = () => (
        <div>
          <h1>Test Title</h1>
          <p>Test paragraph</p>
        </div>
      );

      render(
        <DashboardLayout>
          <TestComponent />
        </DashboardLayout>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test paragraph')).toBeInTheDocument();
    });

    it('should preserve child element structure', () => {
      const { container } = render(
        <DashboardLayout>
          <div data-testid="child-div">
            <span>Child Content</span>
          </div>
        </DashboardLayout>
      );

      const childDiv = container.querySelector('[data-testid="child-div"]');
      expect(childDiv).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render multiple children as siblings', () => {
      const { container } = render(
        <DashboardLayout>
          <section>Section 1</section>
          <section>Section 2</section>
        </DashboardLayout>
      );

      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });
  });

  describe('styling and spacing', () => {
    it('should have padding on main content area', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('p-8');
    });

    it('should have light gray background', () => {
      const { container } = render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );

      const flexContainer = container.firstChild;
      expect(flexContainer).toHaveClass('bg-gray-50');
    });
  });
});
