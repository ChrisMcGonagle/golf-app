/**
 * Tests for Dashboard Pages (PBI-005)
 *
 * Covers: rendering of dashboard main page, submissions page, and members page.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import DashboardPage from '@/app/(authenticated)/dashboard/(with-sidebar)/page';
import SubmissionsPage from '@/app/(authenticated)/dashboard/(with-sidebar)/submissions/page';
import AccountsPage from '@/app/(authenticated)/dashboard/(with-sidebar)/accounts/page';
import { MembersTableClient } from '@/app/(authenticated)/dashboard/(with-sidebar)/members/MembersTableClient';
import type { MemberForDisplay } from '@/lib/actions/getMembers';

describe('DashboardPage', () => {
  describe('rendering', () => {
    it('should render a heading with "Admin Dashboard" title', () => {
      render(<DashboardPage />);
      expect(screen.getByRole('heading', { level: 1, name: /admin dashboard/i })).toBeInTheDocument();
    });

    it('should render welcome message text', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/welcome to the admin dashboard/i)).toBeInTheDocument();
    });

    it('should render navigation hint text', () => {
      render(<DashboardPage />);
      expect(screen.getByText(/use the sidebar to navigate/i)).toBeInTheDocument();
    });
  });

  describe('stat placeholders', () => {
    it('should render quick-access links for new member and membership renewal', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('link', { name: /new member/i })).toHaveAttribute(
        'href',
        '/dashboard/membership-flow?intent=new',
      );
      expect(screen.getByRole('link', { name: /membership renewal/i })).toHaveAttribute(
        'href',
        '/dashboard/membership-flow?intent=renewal',
      );
    });

    it('should render "Total Submissions" stat card', () => {
      render(<DashboardPage />);
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
    });

    it('should render "Total Members" stat card', () => {
      render(<DashboardPage />);
      expect(screen.getByText('Total Members')).toBeInTheDocument();
    });

    it('should display placeholder count of 0 for submissions', () => {
      const { container } = render(<DashboardPage />);
      const stats = screen.getAllByText('0');
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should display placeholder count of 0 for members', () => {
      const { container } = render(<DashboardPage />);
      const stats = screen.getAllByText('0');
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should render stat cards in a grid layout', () => {
      const { container } = render(<DashboardPage />);
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have white background on stat cards', () => {
      const { container } = render(<DashboardPage />);
      const cards = container.querySelectorAll('[class*="bg-white"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('styling', () => {
    it('should have large heading with proper sizing', () => {
      render(<DashboardPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /admin dashboard/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });

    it('should display heading in dark gray', () => {
      render(<DashboardPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /admin dashboard/i });
      expect(heading).toHaveClass('text-gray-900');
    });

    it('should have spacing between heading and welcome text', () => {
      render(<DashboardPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /admin dashboard/i });
      expect(heading).toHaveClass('mb-4');
    });
  });
});

describe('SubmissionsPage', () => {
  describe('rendering', () => {
    it('should render a heading with "Submissions" title', () => {
      render(<SubmissionsPage />);
      expect(screen.getByRole('heading', { level: 1, name: /submissions/i })).toBeInTheDocument();
    });

    it('should render placeholder text', () => {
      render(<SubmissionsPage />);
      expect(screen.getByText(/submissions content coming soon/i)).toBeInTheDocument();
    });

    it('should have proper page structure', () => {
      const { container } = render(<SubmissionsPage />);
      const div = container.firstChild;
      expect(div).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should render heading with correct size and color', () => {
      render(<SubmissionsPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /submissions/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
    });

    it('should have placeholder text in gray color', () => {
      render(<SubmissionsPage />);
      const placeholder = screen.getByText(/submissions content coming soon/i);
      expect(placeholder).toHaveClass('text-gray-600');
    });

    it('should have spacing between heading and text', () => {
      render(<SubmissionsPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /submissions/i });
      expect(heading).toHaveClass('mb-4');
    });
  });
});

describe('MembersPage', () => {
  // Mock test data matching the new MemberForDisplay structure
  const mockMembers: MemberForDisplay[] = [
    {
      id: 'uuid-1',
      memberId: 'M-1024',
      name: 'Aoife Brennan',
      email: 'aoife.brennan@example.com',
      phoneNumber: '(086) 123-4567',
      homeClub: true,
      otherClubs: 'Portmarnock, Royal Dublin',
      membershipType: 'Full Member',
      status: 'Active',
      renewalDate: '12 Jan 2027',
      missingRequiredInfo: true,
      safeguarding: {
        emergencyContactName: 'Siobhan Brennan',
        emergencyContactRelationship: 'Sister',
        emergencyPhone: '(087) 555-1204',
        medicalConditions: 'Exercise-induced asthma',
        allergies: 'Penicillin',
        medications: 'Ventolin inhaler',
        additionalAssistance: 'Keep inhaler available during competitions.',
      },
    },
    {
      id: 'uuid-2',
      memberId: 'M-1048',
      name: 'Conor Walsh',
      email: 'conor.walsh@example.com',
      phoneNumber: '(087) 234-5678',
      homeClub: false,
      otherClubs: 'Greystones',
      membershipType: 'Senior Member',
      status: 'Resigned',
      renewalDate: '28 Feb 2027',
      missingRequiredInfo: false,
      safeguarding: {
        emergencyContactName: 'Fiona Walsh',
        emergencyContactRelationship: 'Spouse',
        emergencyPhone: '(086) 555-7782',
        medicalConditions: 'Type 1 diabetes',
        allergies: 'None reported',
        medications: 'Insulin pen',
        additionalAssistance: 'May need quick access to glucose tablets.',
      },
    },
    {
      id: 'uuid-3',
      memberId: 'M-1081',
      name: 'Niamh O\'Sullivan',
      email: 'niamh.osullivan@example.com',
      phoneNumber: '(085) 345-6789',
      homeClub: true,
      otherClubs: 'Elm Park, Woodenbridge',
      membershipType: 'Juvenile',
      status: 'Active',
      renewalDate: '04 Mar 2027',
      missingRequiredInfo: true,
      safeguarding: {
        emergencyContactName: 'Patrick O\'Sullivan',
        emergencyContactRelationship: 'Father',
        emergencyPhone: '(085) 555-9011',
        medicalConditions: 'History of fainting in extreme heat',
        allergies: 'Peanuts',
        medications: 'None reported',
        additionalAssistance: 'Needs shade, water, and supervision if unwell.',
      },
    },
  ];

  describe('rendering', () => {
    it('should render a heading with "Members" title', () => {
      render(<MembersTableClient members={mockMembers} />);
      expect(screen.getByRole('heading', { level: 1, name: /members/i })).toBeInTheDocument();
    });

    it('should render the member count in the header', () => {
      render(<MembersTableClient members={mockMembers} />);

      const membersHeader = screen.getByRole('heading', { level: 1, name: /members/i }).parentElement;

      expect(membersHeader).not.toBeNull();
      expect(within(membersHeader as HTMLElement).getByText('2')).toBeInTheDocument();

      fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
        target: { value: 'All' },
      });

      expect(within(membersHeader as HTMLElement).getByText('3')).toBeInTheDocument();

      fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
        target: { value: 'Resigned' },
      });

      expect(within(membersHeader as HTMLElement).getByText('1')).toBeInTheDocument();
    });

    it('should render the search and filter toolbar without the old supporting copy', () => {
      render(<MembersTableClient members={mockMembers} />);

      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });

      expect(screen.getByRole('searchbox', { name: /search members/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by membership type/i })).toBeInTheDocument();
      expect(statusFilter).toBeInTheDocument();
      expect(statusFilter).toHaveValue('Active');
      expect(within(statusFilter).getAllByRole('option').map((option) => option.textContent)).toEqual([
        'All',
        'Active',
        'Resigned',
      ]);
      expect(screen.queryByText(/sample member records for dashboard preview/i)).not.toBeInTheDocument();
    });

    it('should render a members table with the updated member details columns in order', () => {
      render(<MembersTableClient members={mockMembers} />);
      const table = screen.getByRole('table', { name: /members table/i });
      const headers = within(table).getAllByRole('columnheader');
      const rows = within(table).getAllByRole('row');
      const firstRowCells = within(rows[1]).getAllByRole('cell');

      expect(Array.from(headers).map((header) => header.textContent?.trim())).toEqual([
        'Member ID',
        'Member',
        'Membership Type',
        'Status',
        'Renewal',
        'Email',
        'Phone Number',
        'Home Club',
        'Actions',
      ]);
      expect(screen.queryByRole('columnheader', { name: /other clubs/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: /missing info/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: /handicap index/i })).not.toBeInTheDocument();
      expect(firstRowCells[0]).toHaveTextContent('M-1024');
      expect(firstRowCells[2]).toHaveTextContent('Full Member');
      expect(firstRowCells[3]).toHaveTextContent('Active');
      expect(firstRowCells[4]).toHaveTextContent('12 Jan 2027');
      expect(firstRowCells[5]).toHaveTextContent('aoife.brennan@example.com');
      expect(firstRowCells[6]).toHaveTextContent('(086) 123-4567');
      expect(firstRowCells[7]).toHaveTextContent('Yes');
      expect(screen.queryByRole('columnheader', { name: /applications/i })).not.toBeInTheDocument();
    });

    it('should show only active members by default', () => {
      render(<MembersTableClient members={mockMembers} />);

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText('Aoife Brennan')).toBeInTheDocument();
      expect(screen.getByText("Niamh O'Sullivan")).toBeInTheDocument();
      expect(screen.queryByText('Conor Walsh')).not.toBeInTheDocument();
      expect(rows).toHaveLength(3);
    });

    it('should show all members when the status filter is switched to all', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
        target: { value: 'All' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText('Aoife Brennan')).toBeInTheDocument();
      expect(screen.getByText('Conor Walsh')).toBeInTheDocument();
      expect(screen.getByText("Niamh O'Sullivan")).toBeInTheDocument();
      expect(rows).toHaveLength(4);
    });

    it('should show only resigned members when the status filter is switched to resigned', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
        target: { value: 'Resigned' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText('Conor Walsh')).toBeInTheDocument();
      expect(screen.queryByText('Aoife Brennan')).not.toBeInTheDocument();
      expect(screen.queryByText("Niamh O'Sullivan")).not.toBeInTheDocument();
      expect(rows).toHaveLength(2);
    });

    it('should narrow rows when searching by first name', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
        target: { value: 'aoife' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText('Aoife Brennan')).toBeInTheDocument();
      expect(screen.queryByText("Niamh O'Sullivan")).not.toBeInTheDocument();
      expect(screen.queryByText('Conor Walsh')).not.toBeInTheDocument();
      expect(rows).toHaveLength(2);
    });

    it('should narrow rows when searching by last name', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
        target: { value: 'sullivan' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText("Niamh O'Sullivan")).toBeInTheDocument();
      expect(screen.queryByText('Aoife Brennan')).not.toBeInTheDocument();
      expect(screen.queryByText('Conor Walsh')).not.toBeInTheDocument();
      expect(rows).toHaveLength(2);
    });

    it('should narrow rows when searching by member ID substring', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
        target: { value: 'All' },
      });

      fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
        target: { value: '048' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText('Conor Walsh')).toBeInTheDocument();
      expect(screen.queryByText('Aoife Brennan')).not.toBeInTheDocument();
      expect(screen.queryByText("Niamh O'Sullivan")).not.toBeInTheDocument();
      expect(rows).toHaveLength(2);
    });

    it('should narrow rows when searching with spaced multi-word input', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
        target: { value: 'niamh o' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText("Niamh O'Sullivan")).toBeInTheDocument();
      expect(screen.queryByText('Aoife Brennan')).not.toBeInTheDocument();
      expect(screen.queryByText('Conor Walsh')).not.toBeInTheDocument();
      expect(rows).toHaveLength(2);
    });

    it('should show an empty state when no rows match the search', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
        target: { value: 'zzzz' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText('No members match the current filters.')).toBeInTheDocument();
      expect(screen.queryByText('Aoife Brennan')).not.toBeInTheDocument();
      expect(screen.queryByText("Niamh O'Sullivan")).not.toBeInTheDocument();
      expect(rows).toHaveLength(2);
    });

    it('should restore rows when the search is cleared', () => {
      render(<MembersTableClient members={mockMembers} />);

      const searchInput = screen.getByRole('searchbox', { name: /search members/i });

      fireEvent.change(searchInput, {
        target: { value: 'aoife' },
      });

      expect(screen.queryByText("Niamh O'Sullivan")).not.toBeInTheDocument();

      fireEvent.change(searchInput, {
        target: { value: '' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');

      expect(screen.getByText('Aoife Brennan')).toBeInTheDocument();
      expect(screen.getByText("Niamh O'Sullivan")).toBeInTheDocument();
      expect(screen.queryByText('Conor Walsh')).not.toBeInTheDocument();
      expect(rows).toHaveLength(3);
    });

    it('should combine the search query with the existing filters', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('combobox', { name: /filter by membership type/i }), {
        target: { value: 'Juvenile' },
      });

      fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
        target: { value: 'niamh' },
      });

      expect(screen.getByText("Niamh O'Sullivan")).toBeInTheDocument();
      expect(screen.queryByText('Aoife Brennan')).not.toBeInTheDocument();

      fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
        target: { value: 'aoife' },
      });

      expect(screen.getByText('No members match the current filters.')).toBeInTheDocument();
    });

    it('should render row actions including info, emergency info, disable for active members, and enable for resigned members', () => {
      render(<MembersTableClient members={mockMembers} />);

      fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
        target: { value: 'All' },
      });

      const table = screen.getByRole('table', { name: /members table/i });
      const rows = within(table).getAllByRole('row');
      const aoifeCells = within(rows[1]).getAllByRole('cell');
      const conorCells = within(rows[2]).getAllByRole('cell');
      const niamhCells = within(rows[3]).getAllByRole('cell');

      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /view details for/i })).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: /show emergency info for/i })).toHaveLength(3);
      expect(screen.getAllByText('SOS')).toHaveLength(3);
      expect(screen.getByRole('button', { name: /show emergency info for aoife brennan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show emergency info for conor walsh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show emergency info for niamh o'sullivan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable aoife brennan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable niamh o'sullivan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enable conor walsh/i })).toBeInTheDocument();
      expect(aoifeCells).toHaveLength(10);
      expect(conorCells).toHaveLength(10);
      expect(niamhCells).toHaveLength(10);
      expect(within(aoifeCells[8]).getAllByRole('button')).toHaveLength(3);
      expect(within(conorCells[8]).getAllByRole('button')).toHaveLength(3);
      expect(within(niamhCells[8]).getAllByRole('button')).toHaveLength(3);
      const aoifeMissingInfoIndicator = within(aoifeCells[9]).getByRole('button', {
        name: /missing required info for aoife brennan/i,
      });
      const niamhMissingInfoIndicator = within(niamhCells[9]).getByRole('button', {
        name: /missing required info for niamh o'sullivan/i,
      });

      expect(aoifeMissingInfoIndicator).toBeDisabled();
      expect(niamhMissingInfoIndicator).toBeDisabled();
      expect(within(aoifeCells[9]).getByText('Missing Member Details')).toBeInTheDocument();
      expect(within(niamhCells[9]).getByText('Missing Member Details')).toBeInTheDocument();
      expect(within(conorCells[9]).queryByRole('button', { name: /missing required info/i })).not.toBeInTheDocument();
      expect(within(conorCells[9]).queryByText('Missing Member Details')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /missing required info for aoife brennan/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /missing required info for niamh o'sullivan/i })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /missing required info for conor walsh/i })).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /missing required info for/i })).toHaveLength(2);
      expect(screen.getAllByText('Missing Member Details')).toHaveLength(2);
    });

    describe('status dialog', () => {
      it('should open a disable modal with the correct member name and membership number', () => {
        render(<MembersTableClient members={mockMembers} />);

        fireEvent.click(screen.getByRole('button', { name: /disable aoife brennan/i }));

        const dialog = screen.getByRole('dialog', { name: /disable member/i });
        const actionSummary = within(dialog).getByText((_, element) => element?.textContent === 'Action: disable');

        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getAllByText(/aoife brennan/i)).toHaveLength(2);
        expect(within(dialog).getAllByText(/m-1024/i)).toHaveLength(2);
        expect(actionSummary).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: /confirm disable/i })).toBeInTheDocument();
      });

      it('should open an enable modal with the correct member name and membership number', () => {
        render(<MembersTableClient members={mockMembers} />);

        fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
          target: { value: 'All' },
        });

        fireEvent.click(screen.getByRole('button', { name: /enable conor walsh/i }));

        const dialog = screen.getByRole('dialog', { name: /enable member/i });
        const actionSummary = within(dialog).getByText((_, element) => element?.textContent === 'Action: enable');

        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getAllByText(/conor walsh/i)).toHaveLength(2);
        expect(within(dialog).getAllByText(/m-1048/i)).toHaveLength(2);
        expect(actionSummary).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: /confirm enable/i })).toBeInTheDocument();
      });

      it('should close the status modal when cancel is clicked', () => {
        render(<MembersTableClient members={mockMembers} />);

        fireEvent.click(screen.getByRole('button', { name: /disable aoife brennan/i }));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    describe('emergency dialog', () => {
      it('should open an emergency modal with safeguarding details for the chosen member', () => {
        render(<MembersTableClient members={mockMembers} />);

        fireEvent.click(screen.getByRole('button', { name: /show emergency info for aoife brennan/i }));

        const dialog = screen.getByRole('dialog', { name: /emergency info/i });

        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getAllByText(/aoife brennan/i)).toHaveLength(2);
        expect(within(dialog).getByText(/siobhan brennan/i)).toBeInTheDocument();
        expect(within(dialog).getByText((_, element) => element?.textContent === 'Relationship: Sister')).toBeInTheDocument();
        expect(within(dialog).getByText((_, element) => element?.textContent === 'Emergency phone: (087) 555-1204')).toBeInTheDocument();
        expect(within(dialog).getByText(/exercise-induced asthma/i)).toBeInTheDocument();
      });

      it('should close the emergency modal when close is clicked', () => {
        render(<MembersTableClient members={mockMembers} />);

        fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
          target: { value: 'All' },
        });

        fireEvent.click(screen.getByRole('button', { name: /show emergency info for conor walsh/i }));
        fireEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(screen.queryByRole('dialog', { name: /emergency info/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('styling', () => {
    it('should render heading with correct size and color', () => {
      render(<MembersTableClient members={mockMembers} />);
      const heading = screen.getByRole('heading', { level: 1, name: /members/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
    });

    it('should have horizontally scrollable table container styling', () => {
      const { container } = render(<MembersTableClient members={mockMembers} />);
      const tableContainer = container.querySelector('[class*="overflow-x-auto"]');

      expect(tableContainer).toHaveClass('overflow-x-auto', 'bg-white', 'ring-gray-200');
    });

    it('should use fixed table layout with explicit columns so widths stay stable when filters change', () => {
      const { container } = render(<MembersTableClient members={mockMembers} />);
      const table = screen.getByRole('table', { name: /members table/i });
      const columns = container.querySelectorAll('colgroup col');

      expect(table).toHaveClass('w-[912px]', 'min-w-[912px]', 'table-fixed');
      expect(columns).toHaveLength(10);
    });

    it('should render rows with a hover state and subtle borders', () => {
      const { container } = render(<MembersTableClient members={mockMembers} />);
      const body = container.querySelector('tbody');
      const firstRow = container.querySelector('tbody tr');

      expect(body).toHaveClass('divide-y', 'divide-gray-100');
      expect(firstRow).toHaveClass('hover:bg-gray-50');
    });
  });
});

describe('AccountsPage', () => {
  describe('rendering', () => {
    it('should render the heading without the old count and dot block', () => {
      const { container } = render(<AccountsPage />);
      const heading = screen.getByRole('heading', { level: 1, name: /^accounts$/i });
      const headerBlock = heading.parentElement;

      expect(heading).toBeInTheDocument();
      expect(headerBlock).not.toBeNull();
      expect(within(headerBlock as HTMLElement).queryByText('4')).not.toBeInTheDocument();
      expect(container.querySelector('.bg-gray-400')).toBeNull();
    });

    it('should render all six account filter tabs', () => {
      render(<AccountsPage />);

      ['All', 'Staff', 'Competitions', 'Handicapping', 'Course', 'Teams'].forEach((label) => {
        expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
      });
    });

    it('should render the account filter tabs in an equal-width six-column grid', () => {
      render(<AccountsPage />);

      const allTab = screen.getByRole('button', { name: 'All' });
      const teamsTab = screen.getByRole('button', { name: 'Teams' });
      const tabRow = allTab.parentElement;

      expect(tabRow).toHaveClass('grid', 'max-w-[780px]', 'grid-cols-6', 'gap-2');
      expect(allTab).toHaveClass(
        'flex',
        'h-11',
        'w-full',
        'items-center',
        'justify-center',
        'px-2',
        'text-center',
        'leading-tight',
        'whitespace-normal',
      );
      expect(teamsTab).toHaveClass('w-full', 'justify-center', 'text-center', 'whitespace-normal');
    });

    it('should select All by default', () => {
      render(<AccountsPage />);

      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Staff' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('should render the selected filter helper text for the default All tab', () => {
      render(<AccountsPage />);

      expect(screen.getByText('All accounts')).toHaveClass('text-md', 'font-semibold', 'text-gray-900');
    });

    it('should update the selected filter helper text when a different tab is clicked', () => {
      render(<AccountsPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Staff' }));

      expect(screen.getByText('Staff accounts')).toBeInTheDocument();
      expect(screen.queryByText('All accounts')).not.toBeInTheDocument();
    });

    it('should render an invite button above the table', () => {
      render(<AccountsPage />);

      const inviteButton = screen.getByRole('button', { name: 'Invite' });

      expect(inviteButton).toHaveClass(
        'inline-flex',
        'items-center',
        'gap-2',
        'rounded-lg',
        'bg-gray-900',
        'px-3',
        'pt-[0.4rem]',
        'pb-[0.4rem]',
        'text-sm',
        'font-medium',
        'text-white',
      );
      expect(inviteButton).not.toHaveClass('border', 'border-gray-300', 'bg-white', 'text-gray-900');
      expect(inviteButton.querySelector('svg')).not.toBeNull();
    });

    it('should render the correct column headers in order', () => {
      render(<AccountsPage />);
      const table = screen.getByRole('table', { name: /accounts table/i });
      const headers = within(table).getAllByRole('columnheader');
      // The Actions column th has role="presentation" and is intentionally excluded
      // from the accessibility tree, so only 6 semantic headers are returned.
      expect(headers.map((h) => h.textContent?.trim())).toEqual([
        'Name',
        'Email',
        'Phone Number',
        'Status',
        'Role',
        'Permissions',
      ]);
    });

    it('should render the phone number value for each mock account', () => {
      render(<AccountsPage />);

      expect(screen.getByText('(087) 512-4431')).toBeInTheDocument();
      expect(screen.getByText('(086) 274-1185')).toBeInTheDocument();
      expect(screen.getByText('(085) 661-9024')).toBeInTheDocument();
      expect(screen.getByText('(089) 340-7762')).toBeInTheDocument();
    });

    it('should render a row for each mock account', () => {
      render(<AccountsPage />);
      expect(screen.getByText('Siobhan Doherty')).toBeInTheDocument();
      expect(screen.getByText('Padraig Sweeney')).toBeInTheDocument();
      expect(screen.getByText('Ciara McLaughlin')).toBeInTheDocument();
      expect(screen.getByText('Eoin Gallagher')).toBeInTheDocument();
    });

    it('should render initials fallback in the name column when an account has no avatar image', () => {
      render(<AccountsPage />);

      const table = screen.getByRole('table', { name: /accounts table/i });
      const siobhanRow = within(table).getByText('Siobhan Doherty').closest('tr');

      expect(siobhanRow).not.toBeNull();
      expect(within(siobhanRow as HTMLElement).getByText('SD')).toBeInTheDocument();
    });

    it('should render an edit button for each row with the correct aria-label', () => {
      render(<AccountsPage />);
      expect(screen.getByRole('button', { name: /edit siobhan doherty/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit padraig sweeney/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit ciara mclaughlin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit eoin gallagher/i })).toBeInTheDocument();
    });

    it('should render an activate/disable toggle button per row', () => {
      render(<AccountsPage />);
      // Active accounts get a Disable button
      expect(screen.getByRole('button', { name: /disable siobhan doherty/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable padraig sweeney/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable ciara mclaughlin/i })).toBeInTheDocument();
      // Disabled accounts get an Activate button
      expect(screen.getByRole('button', { name: /activate eoin gallagher/i })).toBeInTheDocument();
    });

    it('should render compact status chips for active and disabled accounts', () => {
      render(<AccountsPage />);
      const activeChip = screen.getAllByText('Active')[0].parentElement;
      const disabledChip = screen.getByText('Disabled').parentElement;

      expect(activeChip).toHaveClass(
        'inline-flex',
        'items-center',
        'gap-2',
        'rounded-full',
        'border',
        'px-2.5',
        'py-1',
        'text-xs',
        'font-medium',
        'border-emerald-300',
        'bg-emerald-100',
        'text-emerald-800',
      );
      expect(activeChip?.querySelector('.bg-emerald-600')).not.toBeNull();

      expect(disabledChip).toHaveClass(
        'inline-flex',
        'items-center',
        'gap-2',
        'rounded-full',
        'border',
        'px-2.5',
        'py-1',
        'text-xs',
        'font-medium',
        'border-red-200',
        'bg-red-50',
        'text-red-700',
      );
      expect(disabledChip?.querySelector('.bg-red-500')).not.toBeNull();
    });

    it('should toggle status when the activate/disable button is clicked', () => {
      render(<AccountsPage />);
      const disableBtn = screen.getByRole('button', { name: /disable siobhan doherty/i });
      fireEvent.click(disableBtn);
      const siobhanRow = screen.getByText('Siobhan Doherty').closest('tr');

      expect(screen.getByRole('button', { name: /activate siobhan doherty/i })).toBeInTheDocument();
      expect(within(siobhanRow as HTMLElement).getByText('Disabled')).toBeInTheDocument();
    });

    it('should not render any text content inside the edit cells', () => {
      render(<AccountsPage />);
      const editButton = screen.getByRole('button', { name: /edit siobhan doherty/i });
      expect(editButton.textContent?.trim()).toBe('');
    });

    it('should render a clickable more button with the current aria-label and styling for Siobhan row', () => {
      render(<AccountsPage />);

      const table = screen.getByRole('table', { name: /accounts table/i });
      const siobhanRow = within(table).getByText('Siobhan Doherty').closest('tr');

      expect(siobhanRow).not.toBeNull();
      const moreButton = within(siobhanRow as HTMLElement).getByRole('button', {
        name: 'Show 3 more permissions for Siobhan Doherty',
      });

      expect(moreButton).toHaveClass(
        'inline-flex',
        'shrink-0',
        'items-center',
        'ml-2',
        'text-xs',
        'font-medium',
        'text-blue-600',
        'underline',
        'underline-offset-2',
        'hover:text-blue-700',
      );
      expect(moreButton).toHaveAttribute(
        'aria-label',
        'Show 3 more permissions for Siobhan Doherty',
      );
    });

    it('should show all permissions without a more button when an account has three or fewer permissions', () => {
      render(<AccountsPage />);

      const table = screen.getByRole('table', { name: /accounts table/i });
      const padraigRow = within(table).getByText('Padraig Sweeney').closest('tr');
      const ciaraRow = within(table).getByText('Ciara McLaughlin').closest('tr');

      expect(padraigRow).not.toBeNull();
      expect(within(padraigRow as HTMLElement).getAllByText('members').length).toBeGreaterThan(0);
      expect(within(padraigRow as HTMLElement).getAllByText('times').length).toBeGreaterThan(0);
      expect(within(padraigRow as HTMLElement).queryByRole('button', { name: /more permissions/i })).not.toBeInTheDocument();

      expect(ciaraRow).not.toBeNull();
      expect(within(ciaraRow as HTMLElement).getAllByText('members').length).toBeGreaterThan(0);
      expect(within(ciaraRow as HTMLElement).queryByRole('button', { name: /more permissions/i })).not.toBeInTheDocument();
    });

    it('should filter to staff rows only when Staff is selected', () => {
      render(<AccountsPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Staff' }));

      expect(screen.getByRole('button', { name: 'Staff' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('Siobhan Doherty')).not.toBeInTheDocument();
      expect(screen.getByText('Padraig Sweeney')).toBeInTheDocument();
      expect(screen.getByText('Ciara McLaughlin')).toBeInTheDocument();
      expect(screen.getByText('Eoin Gallagher')).toBeInTheDocument();
    });

    it('should show no rows when Course is selected and no accounts have the course permission', () => {
      render(<AccountsPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Course' }));

      expect(screen.getByRole('button', { name: 'Course' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('Siobhan Doherty')).not.toBeInTheDocument();
      expect(screen.queryByText('Padraig Sweeney')).not.toBeInTheDocument();
      expect(screen.queryByText('Ciara McLaughlin')).not.toBeInTheDocument();
      expect(screen.queryByText('Eoin Gallagher')).not.toBeInTheDocument();
    });
  });
});
