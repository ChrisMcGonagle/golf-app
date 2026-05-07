/**
 * Tests for DashboardLayout component (PBI-005)
 *
 * Covers: layout structure with sidebar and main content area, children rendering.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

jest.mock('@/lib/actions/getMembershipRequests', () => ({
  getPendingMembershipRequestCountForAdmin: jest.fn().mockResolvedValue(0),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '@/app/(authenticated)/dashboard/(with-sidebar)/layout';

async function renderDashboardLayout(children: React.ReactNode) {
  return render(await DashboardLayout({ children }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardLayout', () => {
  describe('renders layout structure', () => {
    it('should render a flex container with sidebar and main content', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const flexContainer = container.querySelector('div[class*="flex"]');
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toHaveClass('flex', 'h-screen', 'bg-gray-50');
    });

    it('should render DashboardSidebar component', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside?.className).toContain('bg-white');
      expect(aside?.className).toContain('text-[#2b2b2b]');
    });

    it('should render main content area to the right of sidebar', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('flex-1', 'p-8');
    });

    it('should render children inside main content area', async () => {
      await renderDashboardLayout(<div>Test Content</div>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have flex layout that positions sidebar on left', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const flexContainer = container.firstChild as HTMLElement;
      // Flex containers have display: flex
      expect(flexContainer.className).toMatch(/flex/);
    });

    it('should have sidebar with fixed width', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('w-64');
    });

    it('should have main content area that grows to fill remaining space', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const main = container.querySelector('main');
      expect(main).toHaveClass('flex-1');
    });

    it('should maintain min-h-screen for full viewport height', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const flexContainer = container.firstChild;
      expect(flexContainer).toHaveClass('h-screen');
    });
  });

  describe('children rendering', () => {
    it('should render simple text content', async () => {
      await renderDashboardLayout(<span>Hello World</span>);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render complex component children', async () => {
      const TestComponent = () => (
        <div>
          <h1>Test Title</h1>
          <p>Test paragraph</p>
        </div>
      );

      await renderDashboardLayout(<TestComponent />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test paragraph')).toBeInTheDocument();
    });

    it('should preserve child element structure', async () => {
      const { container } = await renderDashboardLayout(
        <div data-testid="child-div">
          <span>Child Content</span>
        </div>
      );

      const childDiv = container.querySelector('[data-testid="child-div"]');
      expect(childDiv).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render multiple children as siblings', async () => {
      await renderDashboardLayout(
        <>
          <section>Section 1</section>
          <section>Section 2</section>
        </>
      );

      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });
  });

  describe('styling and spacing', () => {
    it('should have padding on main content area', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const main = container.querySelector('main');
      expect(main).toHaveClass('p-8');
    });

    it('should have light gray background', async () => {
      const { container } = await renderDashboardLayout(<div>Test Content</div>);

      const flexContainer = container.firstChild;
      expect(flexContainer).toHaveClass('bg-gray-50');
    });
  });
});
