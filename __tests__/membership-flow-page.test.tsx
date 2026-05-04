import React from 'react';
import { render, screen } from '@testing-library/react';

import MembershipFlowNextPage from '@/app/(authenticated)/dashboard/membership-flow/next/page';
import MembershipFlowPage from '@/app/(authenticated)/dashboard/membership-flow/page';

describe('PBI-011: MembershipFlowPage', () => {
  it('renders the shared choice step for new membership intent', async () => {
    const page = await MembershipFlowPage({
      searchParams: Promise.resolve({ intent: 'new' }),
    });

    render(page);

    expect(screen.getByText(/^choose which$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^form$/i })).toBeInTheDocument();
    expect(screen.getByText(/you are starting: new membership/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /membership form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=new&action=form',
    );
    expect(screen.getByRole('link', { name: /generate email form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=new&action=email',
    );
    expect(
      screen.getByRole('link', { name: /back to membership registration/i }),
    ).toHaveAttribute('href', '/dashboard/membership-registration');
  });

  it('renders the shared choice step for membership renewal intent', async () => {
    const page = await MembershipFlowPage({
      searchParams: Promise.resolve({ intent: 'renewal' }),
    });

    render(page);

    expect(screen.getByText(/you are starting: membership renewal/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /membership form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=renewal&action=form',
    );
    expect(screen.getByRole('link', { name: /generate email form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=renewal&action=email',
    );
  });

  it('defaults to new membership when intent is missing', async () => {
    const page = await MembershipFlowPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByText(/you are starting: new membership/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /membership form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=new&action=form',
    );
  });

  it('defaults to new membership when intent is invalid', async () => {
    const page = await MembershipFlowPage({
      searchParams: Promise.resolve({ intent: 'transfer' }),
    });

    render(page);

    expect(screen.getByText(/you are starting: new membership/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /generate email form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=new&action=email',
    );
  });

  it('redirects renewal intent to member-search on the next handoff page', async () => {
    await expect(
      MembershipFlowNextPage({
        searchParams: Promise.resolve({ intent: 'renewal', action: 'email' }),
      }),
    ).rejects.toThrow();
  });

  it('redirects new intent to membership type selection on the next handoff page', async () => {
    await expect(
      MembershipFlowNextPage({
        searchParams: Promise.resolve({ intent: 'new', action: 'form' }),
      }),
    ).rejects.toThrow();
  });

  it('renders an error when handoff page params are missing', async () => {
    const page = await MembershipFlowNextPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByText(/invalid flow parameters/i)).toBeInTheDocument();
  });

  it('renders an error when handoff page has an invalid action', async () => {
    const page = await MembershipFlowNextPage({
      searchParams: Promise.resolve({ intent: 'renewal', action: 'print' }),
    });

    render(page);

    expect(screen.getByText(/invalid flow parameters/i)).toBeInTheDocument();
  });
});