import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import MembershipFormPage from '@/app/(authenticated)/dashboard/membership/form/page.tsx';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, href }: any) => (
    <a href={href}>{children}</a>
  );
});

const mockRouter = {
  push: jest.fn(),
};

describe('Membership Form Page - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders error when intent is missing', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('typeId=Full+Member&step=1')
    );

    const searchParams = Promise.resolve({
      typeId: 'Full Member',
      step: '1',
    });

    render(await MembershipFormPage({ searchParams }));
    expect(screen.getByText(/Invalid form parameters/i)).toBeInTheDocument();
  });

  it('renders form for new membership with valid params', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('intent=new&typeId=Full+Member&step=1')
    );

    const searchParams = Promise.resolve({
      intent: 'new',
      typeId: 'Full Member',
      step: '1',
    });

    render(await MembershipFormPage({ searchParams }));
    await waitFor(() => {
      expect(screen.getByText(/personal details/i)).toBeInTheDocument();
    });
  });

  it('renders form for renewal with memberId', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('intent=renewal&typeId=Full+Member&memberId=member-123&step=1')
    );

    const searchParams = Promise.resolve({
      intent: 'renewal',
      typeId: 'Full Member',
      memberId: 'member-123',
      step: '1',
    });

    render(await MembershipFormPage({ searchParams }));
    await waitFor(() => {
      expect(screen.getByText(/personal details/i)).toBeInTheDocument();
    });
  });

  it('defaults to step 1 when step is missing', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('intent=new&typeId=Full+Member')
    );

    const searchParams = Promise.resolve({
      intent: 'new',
      typeId: 'Full Member',
    });

    render(await MembershipFormPage({ searchParams }));
    await waitFor(() => {
      expect(screen.getByText(/personal details/i)).toBeInTheDocument();
    });
  });

  it('shows form for new membership on step 1', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('intent=new&typeId=Standard+Member&step=1')
    );

    const searchParams = Promise.resolve({
      intent: 'new',
      typeId: 'Standard Member',
      step: '1',
    });

    render(await MembershipFormPage({ searchParams }));
    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    });
  });

  it('shows form for renewal on step 2', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('intent=renewal&typeId=Full+Member&memberId=member-789&step=2')
    );

    const searchParams = Promise.resolve({
      intent: 'renewal',
      typeId: 'Full Member',
      memberId: 'member-789',
      step: '2',
    });

    render(await MembershipFormPage({ searchParams }));
    await waitFor(() => {
      expect(screen.getByText(/membership details/i)).toBeInTheDocument();
    });
  });

  it('renders error for invalid step number', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('intent=new&typeId=Full+Member&step=5')
    );

    const searchParams = Promise.resolve({
      intent: 'new',
      typeId: 'Full Member',
      step: '5',
    });

    render(await MembershipFormPage({ searchParams }));
    expect(screen.getByText(/Invalid form parameters/i)).toBeInTheDocument();
  });

  it('shows error when renewal missing memberId', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('intent=renewal&typeId=Full+Member&step=1')
    );

    const searchParams = Promise.resolve({
      intent: 'renewal',
      typeId: 'Full Member',
      step: '1',
    });

    render(await MembershipFormPage({ searchParams }));
    expect(screen.getByText(/Invalid form parameters/i)).toBeInTheDocument();
  });

});
