jest.mock('next/navigation', () => ({
  redirect: jest.fn((u) => { throw new Error('NEXT_REDIRECT:' + u); }),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams('')),
}));
jest.mock('@/lib/actions/searchMembers', () => ({ searchMembers: jest.fn() }));
jest.mock('@/components/MemberSearchAutocomplete', () => ({
  __esModule: true,
  default: ({
    intent,
    action,
    initialQuery,
    initialMembers,
  }: {
    intent: string;
    action: string;
    initialQuery: string;
    initialMembers: Array<{ MEMBER_NUMBER: number }>;
  }) => {
    const R = require('react');
    return R.createElement(
      'div',
      { 'data-testid': 'member-search-autocomplete' },
      R.createElement('span', { 'data-testid': 'member-search-intent' }, intent),
      R.createElement('span', { 'data-testid': 'member-search-action' }, action),
      R.createElement('span', { 'data-testid': 'member-search-query' }, initialQuery),
      R.createElement('span', { 'data-testid': 'member-search-count' }, String(initialMembers.length)),
    );
  },
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { searchMembers } from '@/lib/actions/searchMembers';
import MemberSearchPage from '@/app/(authenticated)/dashboard/membership/member-search/page';
import MembershipTypePage from '@/app/(authenticated)/dashboard/membership/type/page';
import MembershipFormPage from '@/app/(authenticated)/dashboard/membership/form/page';
import GenerateEmailFormPage from '@/app/(authenticated)/dashboard/membership/email/page';

const mockSearchMembers = searchMembers as jest.MockedFunction<typeof searchMembers>;

describe('MemberSearchPage (/dashboard/membership/member-search)', () => {
  beforeEach(() => { mockSearchMembers.mockResolvedValue([]); });
  afterEach(() => { jest.clearAllMocks(); });

  it('renders the heading and live search component', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('heading', { name: /find member/i })).toBeInTheDocument();
    expect(screen.getByTestId('member-search-autocomplete')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
  });

  it('passes intent=renewal and action=form to the live search component', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) }));
    expect(screen.getByTestId('member-search-intent').textContent).toBe('renewal');
    expect(screen.getByTestId('member-search-action').textContent).toBe('form');
  });

  it('passes action=email to the live search component', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'email' }) }));
    expect(screen.getByTestId('member-search-action').textContent).toBe('email');
  });

  it('defaults invalid intent to new in the live search component', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'invalid', action: 'form' }) }));
    expect(screen.getByTestId('member-search-intent').textContent).toBe('new');
  });

  it('defaults invalid action to form in the live search component', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'print' }) }));
    expect(screen.getByTestId('member-search-action').textContent).toBe('form');
  });

  it('does not call searchMembers when no query is provided', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) }));
    expect(mockSearchMembers).not.toHaveBeenCalled();
  });

  it('does not call searchMembers when query is a single character', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', query: 'A' }) }));
    expect(mockSearchMembers).not.toHaveBeenCalled();
  });

  it('calls searchMembers when query is at least 2 characters', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', query: 'Sm' }) }));
    expect(mockSearchMembers).toHaveBeenCalledWith('Sm');
  });

  it('passes the current query through to the live search component', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', query: 'Smith' }) }));
    expect(screen.getByTestId('member-search-query').textContent).toBe('Smith');
  });

  it('passes initial member results to the live search component', async () => {
    mockSearchMembers.mockResolvedValue([{ MEMBER_NUMBER: 1001, FIRST_NAME: "Jane", LAST_NAME: "Smith", MEMBERSHIP_TYPE: "Full Member" }]);
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', query: 'Jane' }) }));
    expect(screen.getByTestId('member-search-count').textContent).toBe('1');
  });

  it('renders back link to membership-flow with renewal intent', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) }));
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership-flow?intent=renewal');
  });
});


// MembershipTypePage tests
describe('MembershipTypePage (/dashboard/membership/type)', () => {
  it('renders the "Choose a" label and "Membership Type" heading', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    expect(screen.getByText('Choose a')).toBeInTheDocument();
    expect(screen.getByText('Membership Type')).toBeInTheDocument();
  });

  it('renders membership type titles (Full, Senior, Student, etc.)', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    expect(screen.getByText('Full')).toBeInTheDocument();
    expect(screen.getByText('Senior')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Juvenile')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Overseas')).toBeInTheDocument();
    expect(screen.getByText('Beginner (Year 1)')).toBeInTheDocument();
    expect(screen.getByText('Beginner (Year 2)')).toBeInTheDocument();
  });

  it('creates card links with correct navigation URLs for new intent', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    const seniorLink = screen.getByText('Senior').closest('a');
    expect(seniorLink).toHaveAttribute('href', '/dashboard/membership/form?intent=new&typeId=senior&step=1');
  });

  it('creates card links with correct navigation URLs for renewal intent', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal' }) }));
    const familyLink = screen.getByText('Family').closest('a');
    expect(familyLink).toHaveAttribute('href', '/dashboard/membership/form?intent=renewal&typeId=family&step=1');
  });

  it('includes memberId in card links when provided for renewal', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal', memberId: 'member-123' }) }));
    const familyLink = screen.getByText('Family').closest('a');
    expect(familyLink).toHaveAttribute('href', '/dashboard/membership/form?intent=renewal&typeId=family&step=1&memberId=member-123');
  });

  it('shows back link to membership-flow for new intent', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership-flow?intent=new');
  });

  it('shows back link to membership-flow for renewal intent', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal' }) }));
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership-flow?intent=renewal');
  });

  it('includes memberId in back link when provided', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal', memberId: 'member-456' }) }));
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership-flow?intent=renewal&memberId=member-456');
  });

  it('defaults invalid intent to new', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'invalid' }) }));
    const seniorLink = screen.getByText('Senior').closest('a');
    expect(seniorLink).toHaveAttribute('href', expect.stringContaining('intent=new'));
  });
});

// MembershipFormPage tests
describe("MembershipFormPage (/dashboard/membership/form)", () => {
  it("renders the Membership Form heading", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
  });

  it("renders form for new membership with valid params", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
  });

  it("renders form for renewal with memberId", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'renewal', typeId: 'Senior%20Member', memberId: 'uuid-member-1' }) }));
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
  });

  it("shows error when intent is missing", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ typeId: 'Full%20Member' }) }));
    expect(screen.getByText(/Invalid form parameters/i)).toBeInTheDocument();
  });

  it("shows error when typeId is missing", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    expect(screen.getByText(/Invalid form parameters/i)).toBeInTheDocument();
  });

  it("shows error when step is invalid", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member', step: '5' }) }));
    expect(screen.getByText(/Invalid form parameters/i)).toBeInTheDocument();
  });

  it("renders back link on error", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    const href = screen.getByRole('link', { name: /Back to Membership Type/i }).getAttribute('href');
    expect(href).toContain('/dashboard/membership/type');
  });
});

// GenerateEmailFormPage tests
describe("GenerateEmailFormPage (/dashboard/membership/email)", () => {
  it("renders the Generate Email Form heading", async () => {
    render(await GenerateEmailFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Juvenile' }) }));
    expect(screen.getByRole('heading', { name: /generate email form/i })).toBeInTheDocument();
  });

  it("displays intent, decoded typeId and memberId in context summary (AC#7)", async () => {
    render(await GenerateEmailFormPage({ searchParams: Promise.resolve({ intent: 'renewal', typeId: 'Country%20Member', memberId: 'mid-99' }) }));
    expect(screen.getByText('renewal')).toBeInTheDocument();
    expect(screen.getByText('Country Member')).toBeInTheDocument();
    expect(screen.getByText('mid-99')).toBeInTheDocument();
  });

  it("does not render Member ID row when memberId is absent (AC#7)", async () => {
    render(await GenerateEmailFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Juvenile' }) }));
    expect(screen.queryByText(/member id/i)).not.toBeInTheDocument();
  });

  it("shows email generation coming soon placeholder", async () => {
    render(await GenerateEmailFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Juvenile' }) }));
    expect(screen.getByText(/email generation coming soon/i)).toBeInTheDocument();
  });

  it("renders back link to type selection with action=email (AC#2)", async () => {
    render(await GenerateEmailFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Juvenile' }) }));
    const href = screen.getByRole('link', { name: /back/i }).getAttribute('href');
    expect(href).toContain('/dashboard/membership/type');
    expect(href).toContain('action=email');
  });

  it("includes memberId and memberType in back link for renewal (AC#9)", async () => {
    render(await GenerateEmailFormPage({ searchParams: Promise.resolve({ intent: 'renewal', typeId: 'Full%20Member', memberId: 'uuid-r' }) }));
    const href = screen.getByRole('link', { name: /back/i }).getAttribute('href');
    expect(href).toContain('memberId=uuid-r');
    expect(href).toContain('memberType=Full+Member');
  });

  it("shows dash placeholder when typeId is not provided", async () => {
    render(await GenerateEmailFormPage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// MembershipFlowNextPage tests
// ──────────────────────────────────────────────────────────────────────────────
import MembershipFlowNextPage from '@/app/(authenticated)/dashboard/membership-flow/next/page';

describe('MembershipFlowNextPage (/dashboard/membership-flow/next)', () => {
  const { redirect } = jest.requireMock('next/navigation') as { redirect: jest.Mock };

  beforeEach(() => {
    redirect.mockClear();
    redirect.mockImplementation((u: string) => { throw new Error('NEXT_REDIRECT:' + u); });
  });

  it('renders error page when intent is missing (AC#1)', async () => {
    render(await MembershipFlowNextPage({ searchParams: Promise.resolve({ action: 'form' }) }));
    expect(screen.getByRole('heading', { name: /invalid flow parameters/i })).toBeInTheDocument();
    expect(screen.getByText(/please return to the membership flow/i)).toBeInTheDocument();
  });

  it('renders error page when action is missing', async () => {
    render(await MembershipFlowNextPage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    expect(screen.getByRole('heading', { name: /invalid flow parameters/i })).toBeInTheDocument();
  });

  it('renders error page when both intent and action are missing', async () => {
    render(await MembershipFlowNextPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('heading', { name: /invalid flow parameters/i })).toBeInTheDocument();
  });

  it('renders error page for invalid intent value with valid action', async () => {
    render(await MembershipFlowNextPage({ searchParams: Promise.resolve({ intent: 'garbage', action: 'form' }) }));
    expect(screen.getByRole('heading', { name: /invalid flow parameters/i })).toBeInTheDocument();
  });

  it('renders error page for valid intent with invalid action value', async () => {
    render(await MembershipFlowNextPage({ searchParams: Promise.resolve({ intent: 'new', action: 'print' }) }));
    expect(screen.getByRole('heading', { name: /invalid flow parameters/i })).toBeInTheDocument();
  });

  it('redirects to /dashboard/membership/type for intent=new action=form (AC#1)', async () => {
    await expect(
      MembershipFlowNextPage({ searchParams: Promise.resolve({ intent: 'new', action: 'form' }) })
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/membership/type?intent=new&action=form');
  });

  it('redirects to /dashboard/membership/type for intent=new action=email (AC#2)', async () => {
    await expect(
      MembershipFlowNextPage({ searchParams: Promise.resolve({ intent: 'new', action: 'email' }) })
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/membership/type?intent=new&action=email');
  });

  it('redirects to /dashboard/membership/member-search for intent=renewal action=form (AC#3)', async () => {
    await expect(
      MembershipFlowNextPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) })
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/membership/member-search?intent=renewal&action=form');
  });

  it('redirects to /dashboard/membership/member-search for intent=renewal action=email (AC#3)', async () => {
    await expect(
      MembershipFlowNextPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'email' }) })
    ).rejects.toThrow('NEXT_REDIRECT:/dashboard/membership/member-search?intent=renewal&action=email');
  });
});
