jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import MemberSearchAutocomplete from '@/components/MemberSearchAutocomplete';
import MembershipTypeSelector from '@/components/MembershipTypeSelector';
import { searchMembers } from '@/lib/actions/searchMembers';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockFetch = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>;

const ALL_TYPES = [
  'Full Member', 'Senior Member', 'Student Member', 'Beginner (Year 1)',
  'Beginner (Year 2)', 'Juvenile', 'Country Member', 'Overseas Life Member',
  'Life Member', 'Family Member',
];

const SEARCH_DEBOUNCE_MS = 300;

// MembershipTypeSelector tests
describe('MembershipTypeSelector component', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockUseRouter.mockReturnValue({ push: mockPush, replace: mockReplace } as never);
  });

  it('renders all 10 membership type buttons (AC#5)', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="new" action="form" memberId={undefined} />);
    ALL_TYPES.forEach((type) => {
      expect(screen.getByRole('button', { name: type })).toBeInTheDocument();
    });
  });

  it('Continue button is disabled when no type is selected', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="new" action="form" memberId={undefined} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('pre-selects a type when preSelectedType is provided', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType="Full Member" intent="renewal" action="form" memberId="mid-1" />);
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });

  it('enables Continue button after clicking a type', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="new" action="form" memberId={undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Senior Member' }));
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });

  it('routes to /dashboard/membership/{action} with intent and typeId on Continue (AC#6)', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="new" action="form" memberId={undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Full Member' }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(mockPush).toHaveBeenCalledTimes(1);
    const url = mockPush.mock.calls[0][0];
    expect(url).toContain('/dashboard/membership/form');
    expect(url).toContain('intent=new');
    expect(url).toContain('typeId=');
  });

  it('includes memberId in route when provided (renewal flow, AC#7)', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="renewal" action="form" memberId="member-xyz" />);
    fireEvent.click(screen.getByRole('button', { name: 'Juvenile' }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    const url = mockPush.mock.calls[0][0];
    expect(url).toContain('memberId=member-xyz');
    expect(url).toContain('intent=renewal');
  });

  it('does not include memberId in route when not provided (new flow, AC#7)', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="new" action="email" memberId={undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Life Member' }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    const url = mockPush.mock.calls[0][0];
    expect(url).not.toContain('memberId');
    expect(url).toContain('/dashboard/membership/email');
  });

  it('routes to email action when action=email is passed (AC#2)', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="new" action="email" memberId={undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Country Member' }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(mockPush.mock.calls[0][0]).toContain('/dashboard/membership/email');
  });

  it('does not call router.push when Continue is clicked with no selection', () => {
    render(<MembershipTypeSelector types={ALL_TYPES} preSelectedType={null} intent="new" action="form" memberId={undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('MemberSearchAutocomplete component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockFetch.mockReset();
    mockUseRouter.mockReturnValue({ push: mockPush, replace: mockReplace } as never);
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('does not search when fewer than 2 characters are typed', async () => {
    render(
      <MemberSearchAutocomplete
        intent="renewal"
        action="form"
        initialQuery=""
        initialMembers={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/search by name or member number/i), {
      target: { value: 'A' },
    });

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/no members found/i)).not.toBeInTheDocument();
  });

  it('triggers a debounced search when 2 or more characters are typed', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ members: [] }),
    });

    render(
      <MemberSearchAutocomplete
        intent="renewal"
        action="form"
        initialQuery=""
        initialMembers={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/search by name or member number/i), {
      target: { value: 'Al' },
    });

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });

    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/members/search?query=Al', { cache: 'no-store' });
    expect(mockReplace).toHaveBeenLastCalledWith(
      '/dashboard/membership/member-search?intent=renewal&action=form&query=Al',
      { scroll: false },
    );
  });

  it('renders dropdown results returned from the search route', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        members: [
          {
            id: 'member-1',
            MEMBER_NUMBER: 'M001',
            FIRST_NAME: 'Alice',
            LAST_NAME: 'Brown',
            MEMBERSHIP_TYPE: 'Full Member',
          },
        ],
      }),
    });

    render(
      <MemberSearchAutocomplete
        intent="renewal"
        action="form"
        initialQuery=""
        initialMembers={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/search by name or member number/i), {
      target: { value: 'Al' },
    });

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      await Promise.resolve();
    });

    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText(/member no: M001/i)).toBeInTheDocument();
  });

  it('renders a no-results state for a valid query with no matches', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ members: [] }),
    });

    render(
      <MemberSearchAutocomplete
        intent="renewal"
        action="form"
        initialQuery=""
        initialMembers={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/search by name or member number/i), {
      target: { value: 'ZZ' },
    });

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      await Promise.resolve();
    });

    expect(screen.getByText(/no members found/i)).toBeInTheDocument();
  });

  it('clearing the input clears the current results', async () => {
    render(
      <MemberSearchAutocomplete
        intent="renewal"
        action="form"
        initialQuery="Alice"
        initialMembers={[
          {
            id: 'member-1',
            MEMBER_NUMBER: 'M001',
            FIRST_NAME: 'Alice',
            LAST_NAME: 'Brown',
            MEMBERSHIP_TYPE: 'Full Member',
          },
        ]}
      />,
    );

    expect(screen.getByText('Alice Brown')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/search by name or member number/i), {
      target: { value: '' },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenLastCalledWith(
      '/dashboard/membership/member-search?intent=renewal&action=form',
      { scroll: false },
    );
  });

  it('preserves intent, action, memberId, memberType, and query in generated result links', () => {
    render(
      <MemberSearchAutocomplete
        intent="renewal"
        action="email"
        initialQuery="Alice"
        initialMembers={[
          {
            id: 'member-1',
            MEMBER_NUMBER: 'M001',
            FIRST_NAME: 'Alice',
            LAST_NAME: 'Brown',
            MEMBERSHIP_TYPE: 'Full Member',
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: /alice brown/i })).toHaveAttribute(
      'href',
      '/dashboard/membership/type?intent=renewal&action=email&memberId=member-1&memberType=Full+Member&query=Alice',
    );
  });
});

// searchMembers action tests
describe('searchMembers action', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array for empty query', async () => {
    const result = await searchMembers('');
    expect(result).toEqual([]);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns empty array for single-character query', async () => {
    const result = await searchMembers('A');
    expect(result).toEqual([]);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns empty array for whitespace-only query', async () => {
    const result = await searchMembers('   ');
    expect(result).toEqual([]);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns members from Supabase for valid query', async () => {
    const mockMembers = [
      { id: 'id-1', MEMBER_NUMBER: 'M001', FIRST_NAME: 'Alice', LAST_NAME: 'Brown', MEMBERSHIP_TYPE: 'Full Member' },
    ];
    const mockLimit = jest.fn().mockResolvedValue({ data: mockMembers, error: null });
    const mockOr = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockSelect = jest.fn().mockReturnValue({ or: mockOr });
    const mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
    });
    mockCreateServiceRoleClient.mockReturnValue({ from: mockFrom } as never);

    const result = await searchMembers('Alice');
    expect(result).toEqual(mockMembers);
    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(mockSelect).toHaveBeenCalledWith('id, MEMBER_NUMBER, FIRST_NAME, LAST_NAME, MEMBERSHIP_TYPE');
    expect(mockOr).toHaveBeenCalledWith('FIRST_NAME.ilike.%Alice%,LAST_NAME.ilike.%Alice%,MEMBER_NUMBER.ilike.%Alice%');
  });

  it('returns empty array when Supabase returns an error', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    });
    mockCreateServiceRoleClient.mockReturnValue({ from: mockFrom } as never);

    const result = await searchMembers('Alice');
    expect(result).toEqual([]);
  });

  it('returns empty array when Supabase throws an exception', async () => {
    mockCreateServiceRoleClient.mockImplementation(() => { throw new Error('connection failed'); });

    const result = await searchMembers('Alice');
    expect(result).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP_TYPES constant tests
// ──────────────────────────────────────────────────────────────────────────────
import { MEMBERSHIP_TYPES } from '@/lib/constants/membershipTypes';

describe('MEMBERSHIP_TYPES constant', () => {
  it('contains exactly 10 membership types', () => {
    expect(MEMBERSHIP_TYPES).toHaveLength(10);
  });

  it('contains all expected membership type values', () => {
    const expected = [
      'Full Member', 'Senior Member', 'Student Member',
      'Beginner (Year 1)', 'Beginner (Year 2)', 'Juvenile',
      'Country Member', 'Overseas Life Member', 'Life Member', 'Family Member',
    ];
    expected.forEach((type) => expect(MEMBERSHIP_TYPES).toContain(type));
  });

  it('has no duplicate entries', () => {
    expect(new Set(MEMBERSHIP_TYPES).size).toBe(MEMBERSHIP_TYPES.length);
  });

  it('all entries are non-empty strings', () => {
    MEMBERSHIP_TYPES.forEach((type) => {
      expect(typeof type).toBe('string');
      expect(type.trim().length).toBeGreaterThan(0);
    });
  });
});
