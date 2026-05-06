/**
 * Tests for Dashboard Pages (PBI-005)
 *
 * Covers: rendering of dashboard main page, submissions page, and members page.
 */

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import DashboardPage from '@/app/(authenticated)/dashboard/(with-sidebar)/page';
import SubmissionsPage from '@/app/(authenticated)/dashboard/(with-sidebar)/submissions/page';
import MembersPage from '@/app/(authenticated)/dashboard/(with-sidebar)/members/page';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>;

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
      render(<DashboardPage />);
      const stats = screen.getAllByText('0');
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should display placeholder count of 0 for members', () => {
      render(<DashboardPage />);
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
  const mockMembersData = [
    {
      member_number: 'M-1024',
      first_name: 'Aoife',
      last_name: 'Brennan',
      membership_type: 'Full Member',
      status: 'active',
      email: 'aoife.brennan@example.com',
      mobile_phone: '(086) 123-4567',
      home_club: null,
      secondary_club: 'Portmarnock, Royal Dublin',
      missingRequiredInfo: true,
    },
    {
      member_number: 'M-1048',
      first_name: 'Conor',
      last_name: 'Walsh',
      membership_type: 'Country Member',
      status: 'inactive',
      email: 'conor.walsh@example.com',
      mobile_phone: '(087) 234-5678',
      home_club: null,
      secondary_club: 'Greystones',
      missingRequiredInfo: false,
    },
    {
      member_number: 'M-1081',
      first_name: 'Niamh',
      last_name: "O'Sullivan",
      membership_type: 'Juvenile',
      status: 'active',
      email: 'niamh.osullivan@example.com',
      mobile_phone: '(085) 345-6789',
      home_club: null,
      secondary_club: 'Elm Park, Woodenbridge',
      missingRequiredInfo: true,
    },
  ];

  beforeEach(() => {
    const mockOrder = jest.fn().mockResolvedValue({ data: mockMembersData, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    mockCreateServiceRoleClient.mockReturnValue({ from: jest.fn().mockReturnValue({ select: mockSelect }) } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render a heading with "Members" title', async () => {
      render(await MembersPage());
      expect(screen.getByRole('heading', { level: 1, name: /members/i })).toBeInTheDocument();
    });

    it('should render the member count in the header', async () => {
      render(await MembersPage());
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render the search and filter toolbar without the old supporting copy', async () => {
      render(await MembersPage());

      expect(screen.getByRole('searchbox', { name: /search members/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by membership type/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
      expect(screen.queryByText(/sample member records for dashboard preview/i)).not.toBeInTheDocument();
    });

    it('should render a members table with the updated member details columns in order', async () => {
      render(await MembersPage());
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
        'Other Clubs',
        'Actions',
      ]);
      expect(screen.queryByRole('columnheader', { name: /missing info/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: /handicap index/i })).not.toBeInTheDocument();
      expect(firstRowCells[0]).toHaveTextContent('M-1024');
      expect(firstRowCells[2]).toHaveTextContent('Full');
      expect(firstRowCells[3]).toHaveTextContent('active');
      expect(firstRowCells[4]).toHaveTextContent('—');
      expect(firstRowCells[5]).toHaveTextContent('aoife.brennan@example.com');
      expect(firstRowCells[6]).toHaveTextContent('(086) 123-4567');
      expect(firstRowCells[7]).toHaveTextContent('—');
      expect(firstRowCells[8]).toHaveTextContent('Portmarnock, Royal Dublin');
      expect(screen.queryByRole('columnheader', { name: /applications/i })).not.toBeInTheDocument();
    });

    it('should render row actions including info, emergency info, disable for active members, and enable for inactive members', async () => {
      render(await MembersPage());

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
      expect(aoifeCells).toHaveLength(11);
      expect(conorCells).toHaveLength(11);
      expect(niamhCells).toHaveLength(11);
      expect(within(aoifeCells[9]).getAllByRole('button')).toHaveLength(3);
      expect(within(conorCells[9]).getAllByRole('button')).toHaveLength(3);
      expect(within(niamhCells[9]).getAllByRole('button')).toHaveLength(3);
      const aoifeMissingInfoIndicator = within(aoifeCells[10]).getByRole('button', {
        name: /missing required info for aoife brennan/i,
      });
      const niamhMissingInfoIndicator = within(niamhCells[10]).getByRole('button', {
        name: /missing required info for niamh o'sullivan/i,
      });

      expect(aoifeMissingInfoIndicator).toBeDisabled();
      expect(niamhMissingInfoIndicator).toBeDisabled();
      expect(within(aoifeCells[10]).getByText('Missing Member Details')).toBeInTheDocument();
      expect(within(niamhCells[10]).getByText('Missing Member Details')).toBeInTheDocument();
      expect(within(conorCells[10]).queryByRole('button', { name: /missing required info/i })).not.toBeInTheDocument();
      expect(within(conorCells[10]).queryByText('Missing Member Details')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /missing required info for aoife brennan/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /missing required info for niamh o'sullivan/i })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /missing required info for conor walsh/i })).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /missing required info for/i })).toHaveLength(2);
      expect(screen.getAllByText('Missing Member Details')).toHaveLength(2);
    });

    describe('status dialog', () => {
      it('should open a disable modal with the correct member name and membership number', async () => {
        render(await MembersPage());

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

      it('should open an enable modal with the correct member name and membership number', async () => {
        render(await MembersPage());

        fireEvent.click(screen.getByRole('button', { name: /enable conor walsh/i }));

        const dialog = screen.getByRole('dialog', { name: /enable member/i });
        const actionSummary = within(dialog).getByText((_, element) => element?.textContent === 'Action: enable');

        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getAllByText(/conor walsh/i)).toHaveLength(2);
        expect(within(dialog).getAllByText(/m-1048/i)).toHaveLength(2);
        expect(actionSummary).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: /confirm enable/i })).toBeInTheDocument();
      });

      it('should close the status modal when cancel is clicked', async () => {
        render(await MembersPage());

        fireEvent.click(screen.getByRole('button', { name: /disable aoife brennan/i }));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    describe('emergency dialog', () => {
      it('should open an emergency modal for the chosen member', async () => {
        render(await MembersPage());

        fireEvent.click(screen.getByRole('button', { name: /show emergency info for aoife brennan/i }));

        const dialog = screen.getByRole('dialog', { name: /emergency info/i });

        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getAllByText(/aoife brennan/i)).toHaveLength(2);
        expect(within(dialog).getByText(/m-1024/i)).toBeInTheDocument();
      });

      it('should close the emergency modal when close is clicked', async () => {
        render(await MembersPage());

        fireEvent.click(screen.getByRole('button', { name: /show emergency info for conor walsh/i }));
        fireEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(screen.queryByRole('dialog', { name: /emergency info/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('styling', () => {
    it('should render heading with correct size and color', async () => {
      render(await MembersPage());
      const heading = screen.getByRole('heading', { level: 1, name: /members/i });
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');
    });

    it('should have horizontally scrollable table container styling', async () => {
      const { container } = render(await MembersPage());
      const tableContainer = container.querySelector('[class*="overflow-x-auto"]');

      expect(tableContainer).toHaveClass('overflow-x-auto', 'bg-white', 'ring-gray-200');
    });

    it('should render rows with a hover state and subtle borders', async () => {
      const { container } = render(await MembersPage());
      const body = container.querySelector('tbody');
      const firstRow = container.querySelector('tbody tr');

      expect(body).toHaveClass('divide-y', 'divide-gray-100');
      expect(firstRow).toHaveClass('hover:bg-gray-50');
    });
  });
});
