/**
 * Tests for SignOffButton component (PBI-003d)
 *
 * Covers: rendering, click handler clearing session and redirecting.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRouterReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}));

jest.mock('@/app/actions/clear-active-user', () => ({
  clearActiveUser: jest.fn().mockResolvedValue({ success: true }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { clearActiveUser } from '@/app/actions/clear-active-user';
import SignOffButton from '@/components/SignOffButton';

const mockClearActiveUser = clearActiveUser as jest.MockedFunction<typeof clearActiveUser>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SignOffButton', () => {
  beforeEach(() => {
    mockClearActiveUser.mockClear();
    mockRouterReplace.mockClear();
  });

  it('renders a button with text "Sign Off"', () => {
    render(<SignOffButton />);
    expect(screen.getByRole('button', { name: /sign off/i })).toBeInTheDocument();
  });

  it('applies the className prop to the button', () => {
    render(<SignOffButton className="custom-class" />);
    expect(screen.getByRole('button', { name: /sign off/i })).toHaveClass('custom-class');
  });

  it('calls clearActiveUser and navigates to /select-user when clicked', async () => {
    render(<SignOffButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign off/i }));
      await Promise.resolve();
    });

    expect(mockClearActiveUser).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith('/select-user');
  });
});
