/**
 * Tests for NewMemberPage (PBI-008)
 *
 * Acceptance Criteria:
 * 1. Page renders without errors
 * 2. Heading displays "New Member"
 * 3. Placeholder text "Placeholder for new member registration form" is visible
 * 4. Back link points to "/dashboard/membership-registration"
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import NewMemberPage from '@/app/(authenticated)/dashboard/new-member/page';

describe('PBI-008: NewMemberPage', () => {
  beforeEach(() => {
    render(<NewMemberPage />);
  });

  it('renders without errors', () => {
    expect(document.body).toBeTruthy();
  });

  it('displays the "New Member" heading', () => {
    expect(
      screen.getByRole('heading', { name: /new member/i })
    ).toBeInTheDocument();
  });

  it('displays the placeholder text', () => {
    expect(screen.getByText(/placeholder for new member registration form/i)).toBeInTheDocument();
  });

  it('has a back link to /dashboard/membership-registration', () => {
    const backLink = screen.getByRole('link', { name: /back to membership registration/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/dashboard/membership-registration');
  });
});
