jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}));

import { getMembers } from '@/lib/actions/getMembers';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<
  typeof createServiceRoleClient
>;

describe('getMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('orders members by surname then first name and maps display names as last_name, first_name', async () => {
    const orderByFirstName = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'member-2',
          member_number: '0002',
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          mobile_phone: '222',
          membership_type: 'Adult',
          status: 'active',
          renewal_date: null,
          home_club: 'Baffie',
          secondary_club: null,
          emergency_contact_name: 'John Doe',
          emergency_contact_relationship: 'Parent',
          emergency_phone_number: '999',
          medical_conditions: null,
          allergies: null,
          medications: null,
          additional_assistance: null,
        },
        {
          id: 'member-1',
          member_number: '0001',
          first_name: 'John',
          last_name: 'Smith',
          email: 'john@example.com',
          mobile_phone: '111',
          membership_type: 'Adult',
          status: 'inactive',
          renewal_date: null,
          home_club: null,
          secondary_club: 'Other Club',
          emergency_contact_name: 'Jane Smith',
          emergency_contact_relationship: 'Parent',
          emergency_phone_number: '888',
          medical_conditions: null,
          allergies: null,
          medications: null,
          additional_assistance: null,
        },
      ],
      error: null,
    });
    const orderByLastName = jest.fn().mockReturnValue({
      order: orderByFirstName,
    });
    const select = jest.fn().mockReturnValue({
      order: orderByLastName,
    });

    mockCreateServiceRoleClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select,
      }),
    } as never);

    const members = await getMembers();

    expect(select).toHaveBeenCalledWith('*');
    expect(orderByLastName).toHaveBeenCalledWith('last_name', { ascending: true });
    expect(orderByFirstName).toHaveBeenCalledWith('first_name', { ascending: true });
    expect(members).toEqual([
      expect.objectContaining({
        id: 'member-2',
        memberId: '0002',
        name: 'Doe, Jane',
        status: 'Active',
      }),
      expect.objectContaining({
        id: 'member-1',
        memberId: '0001',
        name: 'Smith, John',
        status: 'Resigned',
      }),
    ]);
  });
});