jest.mock('next/navigation', () => ({ redirect: jest.fn((u) => { throw new Error('NEXT_REDIRECT:' + u); }) }));
jest.mock('@/lib/actions/searchMembers', () => ({ searchMembers: jest.fn() }));
jest.mock('@/components/MembershipTypeSelector', () => ({
  __esModule: true,
  default: ({ types, preSelectedType, intent, action, memberId }: {
    types: string[]; preSelectedType: string | null; intent: string; action: string; memberId: string | undefined;
  }) => {
    const R = require("react");
    return R.createElement("div", { "data-testid": "membership-type-selector" },
      R.createElement("span", { "data-testid": "selector-types" }, types.join("|")),
      preSelectedType ? R.createElement("span", { "data-testid": "selector-preselected" }, preSelectedType) : null,
      R.createElement("span", { "data-testid": "selector-intent" }, intent),
      R.createElement("span", { "data-testid": "selector-action" }, action),
      memberId ? R.createElement("span", { "data-testid": "selector-memberid" }, memberId) : null,
    );
  },
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { searchMembers } from '@/lib/actions/searchMembers';
import { MEMBERSHIP_TYPES } from '@/lib/constants/membershipTypes';
import MemberSearchPage from '@/app/(authenticated)/dashboard/membership/member-search/page';
import MembershipTypePage from '@/app/(authenticated)/dashboard/membership/type/page';
import MembershipFormPage from '@/app/(authenticated)/dashboard/membership/form/page';
import GenerateEmailFormPage from '@/app/(authenticated)/dashboard/membership/email/page';

const mockSearchMembers = searchMembers as jest.MockedFunction<typeof searchMembers>;

describe('MemberSearchPage (/dashboard/membership/member-search)', () => {
  beforeEach(() => { mockSearchMembers.mockResolvedValue([]); });
  afterEach(() => { jest.clearAllMocks(); });

  it('renders the heading and search form', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('heading', { name: /find member/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search by name or member number/i)).toBeInTheDocument();
  });

  it('preserves intent=renewal and action=form as hidden inputs', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) }));
    expect((document.querySelector('input[name="intent"]') as HTMLInputElement).value).toBe('renewal');
    expect((document.querySelector('input[name="action"]') as HTMLInputElement).value).toBe('form');
  });

  it('preserves action=email as hidden input', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'email' }) }));
    expect((document.querySelector('input[name="action"]') as HTMLInputElement).value).toBe('email');
  });

  it('defaults invalid intent to new in hidden input', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'invalid', action: 'form' }) }));
    expect((document.querySelector('input[name="intent"]') as HTMLInputElement).value).toBe('new');
  });

  it('defaults invalid action to form in hidden input', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'print' }) }));
    expect((document.querySelector('input[name="action"]') as HTMLInputElement).value).toBe('form');
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

  it('shows No members found when search returns empty results', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', query: 'Smith' }) }));
    expect(screen.getByText(/no members found/i)).toBeInTheDocument();
  });

  it('renders member result with correct link to type selection (AC#3)', async () => {
    mockSearchMembers.mockResolvedValue([{ id: "uuid-1", member_number: "M001", first_name: "Jane", last_name: "Smith", membership_type: "Full Member" }]);
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', query: 'Jane' }) }));
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /jane smith/i });
    expect(link).toHaveAttribute('href', '/dashboard/membership/type?intent=renewal&action=form&memberId=uuid-1&memberType=Full%20Member');
  });

  it('renders multiple members from search results', async () => {
    mockSearchMembers.mockResolvedValue([
      { id: "id-1", member_number: "M001", first_name: "Alice", last_name: "Brown", membership_type: "Full Member" },
      { id: "id-2", member_number: "M002", first_name: "Bob", last_name: "Brown", membership_type: "Senior Member" },
    ]);
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'email', query: 'Brown' }) }));
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText('Bob Brown')).toBeInTheDocument();
  });

  it('passes action=email through member links when action is email', async () => {
    mockSearchMembers.mockResolvedValue([{ id: "id-1", member_number: "M001", first_name: "Alice", last_name: "Brown", membership_type: "Full Member" }]);
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'email', query: 'Alice' }) }));
    expect(screen.getByRole('link', { name: /alice brown/i }).getAttribute('href')).toContain('action=email');
  });

  it('renders back link to membership-flow with renewal intent', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) }));
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership-flow?intent=renewal');
  });

  it('does not show member list when no search was performed', async () => {
    render(await MemberSearchPage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) }));
    expect(screen.queryByText(/no members found/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});


// MembershipTypePage tests
describe('MembershipTypePage (/dashboard/membership/type)', () => {
  it('renders the Select Membership Type heading', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new', action: 'form' }) }));
    expect(screen.getByRole('heading', { name: /select membership type/i })).toBeInTheDocument();
  });

  it('passes all 10 MEMBERSHIP_TYPES to the selector (AC#5)', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new', action: 'form' }) }));
    const typesEl = screen.getByTestId('selector-types');
    expect(typesEl.textContent!.split('|')).toHaveLength(10);
    MEMBERSHIP_TYPES.forEach((type) => expect(typesEl.textContent).toContain(type));
  });

  it('passes intent and action through to the selector (AC#8)', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'email' }) }));
    expect(screen.getByTestId('selector-intent').textContent).toBe('renewal');
    expect(screen.getByTestId('selector-action').textContent).toBe('email');
  });

  it('pre-selects a valid memberType from MEMBERSHIP_TYPES', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', memberType: 'Full Member', memberId: 'id-1' }) }));
    expect(screen.getByTestId('selector-preselected').textContent).toBe('Full Member');
  });

  it('does not pre-select an invalid memberType not in the list', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', memberType: 'Gold Member', memberId: 'id-1' }) }));
    expect(screen.queryByTestId('selector-preselected')).not.toBeInTheDocument();
  });

  it('passes memberId to the selector for renewal flows (AC#4, AC#8)', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form', memberId: 'member-abc' }) }));
    expect(screen.getByTestId('selector-memberid').textContent).toBe('member-abc');
  });

  it('does not pass memberId to the selector for new membership flows', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new', action: 'form' }) }));
    expect(screen.queryByTestId('selector-memberid')).not.toBeInTheDocument();
  });

  it('shows back link to member-search for renewal intent (AC#3)', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'renewal', action: 'form' }) }));
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership/member-search?intent=renewal&action=form');
  });

  it('shows back link to membership-flow for new intent (AC#1)', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new', action: 'form' }) }));
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership-flow?intent=new');
  });

  it('defaults invalid intent to new and uses correct back link', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'garbage', action: 'form' }) }));
    expect(screen.getByTestId('selector-intent').textContent).toBe('new');
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/dashboard/membership-flow?intent=new');
  });

  it('defaults invalid action to form in selector', async () => {
    render(await MembershipTypePage({ searchParams: Promise.resolve({ intent: 'new', action: 'invalid' }) }));
    expect(screen.getByTestId('selector-action').textContent).toBe('form');
  });
});

// MembershipFormPage tests
describe("MembershipFormPage (/dashboard/membership/form)", () => {
  it("renders the Membership Form heading", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    expect(screen.getByRole('heading', { name: /membership form/i })).toBeInTheDocument();
  });

  it("displays intent in the context summary (AC#7)", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it("decodes and displays the membership type from typeId (AC#7)", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    expect(screen.getByText('Full Member')).toBeInTheDocument();
  });

  it("shows memberId in context summary for renewal flows (AC#7)", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'renewal', typeId: 'Senior%20Member', memberId: 'uuid-member-1' }) }));
    expect(screen.getByText('uuid-member-1')).toBeInTheDocument();
    expect(screen.getByText('renewal')).toBeInTheDocument();
    expect(screen.getByText('Senior Member')).toBeInTheDocument();
  });

  it("does not display Member ID row when memberId is absent (AC#7)", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    expect(screen.queryByText(/member id/i)).not.toBeInTheDocument();
  });

  it("shows placeholder message for coming-soon form steps", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    expect(screen.getByText(/coming in pbi-015/i)).toBeInTheDocument();
  });

  it("renders back link to type selection with intent and action=form", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new', typeId: 'Full%20Member' }) }));
    const href = screen.getByRole('link', { name: /back/i }).getAttribute('href');
    expect(href).toContain('/dashboard/membership/type');
    expect(href).toContain('intent=new');
    expect(href).toContain('action=form');
  });

  it("includes memberId and memberType in back link for renewal (AC#9)", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'renewal', typeId: 'Full%20Member', memberId: 'uuid-1' }) }));
    const href = screen.getByRole('link', { name: /back/i }).getAttribute('href');
    expect(href).toContain('memberId=uuid-1');
    expect(href).toContain('memberType=Full+Member');
  });

  it("shows dash placeholder when typeId is not provided", async () => {
    render(await MembershipFormPage({ searchParams: Promise.resolve({ intent: 'new' }) }));
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
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
