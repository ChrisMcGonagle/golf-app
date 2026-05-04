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

    expect(screen.getByRole('heading', { name: /choose next step/i })).toBeInTheDocument();
    expect(screen.getByText(/you are starting: new membership/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /membership form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=new&action=form',
    );
    expect(screen.getByRole('link', { name: /generate email form/i })).toHaveAttribute(
      'href',
      '/dashboard/membership-flow/next?intent=new&action=email',
    );
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

  it('preserves both intent and selected action on the next handoff page', async () => {
    const page = await MembershipFlowNextPage({
      searchParams: Promise.resolve({ intent: 'renewal', action: 'email' }),
    });

    render(page);

    expect(screen.getByText(/intent: renewal/i)).toBeInTheDocument();
    expect(screen.getByText(/action: email/i)).toBeInTheDocument();
  });

  it('defaults the handoff page to new intent and form action when params are missing', async () => {
    const page = await MembershipFlowNextPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByText(/intent: new/i)).toBeInTheDocument();
    expect(screen.getByText(/action: form/i)).toBeInTheDocument();
  });

  it('preserves a valid intent and defaults an invalid action to form', async () => {
    const page = await MembershipFlowNextPage({
      searchParams: Promise.resolve({ intent: 'renewal', action: 'print' }),
    });

    render(page);

    expect(screen.getByText(/intent: renewal/i)).toBeInTheDocument();
    expect(screen.getByText(/action: form/i)).toBeInTheDocument();
  });
});