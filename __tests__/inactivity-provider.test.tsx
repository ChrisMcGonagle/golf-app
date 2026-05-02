/**
 * Tests for InactivityProvider component (PBI-003d)
 *
 * Covers: timer-based auto-lockout, event-driven reset, cleanup on unmount.
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
import { render, screen, act } from '@testing-library/react';
import { clearActiveUser } from '@/app/actions/clear-active-user';
import InactivityProvider from '@/components/InactivityProvider';

const mockClearActiveUser = clearActiveUser as jest.MockedFunction<typeof clearActiveUser>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InactivityProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockClearActiveUser.mockClear();
    mockRouterReplace.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders children', () => {
    render(
      <InactivityProvider>
        <span>child content</span>
      </InactivityProvider>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('calls clearActiveUser and redirects to /select-user after 300000ms of inactivity', async () => {
    render(
      <InactivityProvider>
        <span>child</span>
      </InactivityProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(300_000);
      // Flush microtasks so the async callback inside setTimeout completes
      await Promise.resolve();
    });

    expect(mockClearActiveUser).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith('/select-user');
  });

  it('does NOT trigger lockout when a mousemove event resets the timer before timeout', async () => {
    render(
      <InactivityProvider>
        <span>child</span>
      </InactivityProvider>
    );

    // Advance 200 000 ms — still within the 5-minute window
    act(() => {
      jest.advanceTimersByTime(200_000);
    });

    // Fire a mousemove to reset the timer
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    // Advance another 200 000 ms — still within the fresh 5-minute window
    act(() => {
      jest.advanceTimersByTime(200_000);
    });

    // Should NOT have triggered lockout
    expect(mockClearActiveUser).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('removes event listeners and clears the timer on unmount', async () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <InactivityProvider>
        <span>child</span>
      </InactivityProvider>
    );

    unmount();

    // Each of the 4 event types should have been removed
    const expectedEvents = ['mousemove', 'keydown', 'pointerdown', 'touchstart'];
    for (const event of expectedEvents) {
      expect(removeSpy).toHaveBeenCalledWith(event, expect.any(Function));
    }

    expect(clearTimeoutSpy).toHaveBeenCalled();

    addSpy.mockRestore();
    removeSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
