import { createServiceRoleClient } from '@/lib/supabase/server';

export interface MemberRecord {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile_phone: string | null;
  membership_type: string;
  status: 'active' | 'inactive' | 'pending';
  renewal_date: string | null;
  home_club: string | null;
  secondary_club: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_phone_number: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  medications: string | null;
  additional_assistance: string | null;
}

export interface MemberForDisplay {
  id: string;
  memberId: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  membershipType: string;
  status: 'Active' | 'Resigned' | 'Pending';
  renewalDate: string | null;
  homeClub: boolean;
  otherClubs: string | null;
  missingRequiredInfo: boolean;
  safeguarding: {
    emergencyContactName: string | null;
    emergencyContactRelationship: string | null;
    emergencyPhone: string | null;
    medicalConditions: string | null;
    allergies: string | null;
    medications: string | null;
    additionalAssistance: string | null;
  };
}

type MemberRow = Partial<MemberRecord> & Record<string, unknown>;

type MemberDisplayStatus = MemberForDisplay['status'];

function getMemberValue<T>(record: MemberRow, key: keyof MemberRecord): T | undefined {
  const lowerCaseValue = record[key];

  if (lowerCaseValue !== undefined) {
    return lowerCaseValue as T;
  }

  const upperCaseValue = record[key.toUpperCase()];

  if (upperCaseValue !== undefined) {
    return upperCaseValue as T;
  }

  return undefined;
}

function normalizeMemberStatus(status: string | null | undefined): MemberDisplayStatus {
  const normalizedStatus = status?.trim().toLowerCase();

  const statusMap: Record<string, MemberDisplayStatus> = {
    active: 'Active',
    inactive: 'Resigned',
    resigned: 'Resigned',
    pending: 'Pending',
  };

  return normalizedStatus ? statusMap[normalizedStatus] || 'Pending' : 'Pending';
}

function formatMemberDisplayName(record: MemberRow): string {
  const firstName = getMemberValue<string>(record, 'first_name')?.trim() || '';
  const lastName = getMemberValue<string>(record, 'last_name')?.trim() || '';

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }

  return lastName || firstName;
}

export async function getMembers(): Promise<MemberForDisplay[]> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('[getMembers] Supabase error:', error.message, error.code);
      return [];
    }

    if (!data) {
      return [];
    }

    // Filter out admin members
    const nonAdminData = data.filter((record: MemberRow) => {
      const membershipType = getMemberValue<string>(record, 'membership_type') || '';
      return membershipType.toLowerCase() !== 'admin';
    });

    // Transform database records to display format
    return nonAdminData.map((record: MemberRow) => {
      const status = getMemberValue<MemberRecord['status']>(record, 'status');
      const displayStatus = normalizeMemberStatus(status);
      const rawMemberId = getMemberValue<string | number | null>(record, 'member_number');
      const memberId = rawMemberId == null ? '' : String(rawMemberId);

      const emergencyContactName = getMemberValue<string | null>(record, 'emergency_contact_name') || null;
      const emergencyPhone = getMemberValue<string | null>(record, 'emergency_phone_number') || null;

      // Determine if required info is missing using a sensible minimal rule:
      // A member is missing required info if they lack essential contact or safeguarding fields.
      // Required fields: emergency_contact_name, emergency_phone_number (for safeguarding)
      const missingRequiredInfo =
        !emergencyContactName ||
        !emergencyPhone;

      return {
        id: getMemberValue<string>(record, 'id') || '',
        memberId,
        name: formatMemberDisplayName(record),
        email: getMemberValue<string | null>(record, 'email') || null,
        phoneNumber: getMemberValue<string | null>(record, 'mobile_phone') || null,
        membershipType: getMemberValue<string>(record, 'membership_type') || '',
        status: displayStatus,
        renewalDate: getMemberValue<string | null>(record, 'renewal_date') || null,
        homeClub: Boolean(getMemberValue<string | null>(record, 'home_club')),
        otherClubs: getMemberValue<string | null>(record, 'secondary_club') || null,
        missingRequiredInfo,
        safeguarding: {
          emergencyContactName,
          emergencyContactRelationship: getMemberValue<string | null>(record, 'emergency_contact_relationship') || null,
          emergencyPhone,
          medicalConditions: getMemberValue<string | null>(record, 'medical_conditions') || null,
          allergies: getMemberValue<string | null>(record, 'allergies') || null,
          medications: getMemberValue<string | null>(record, 'medications') || null,
          additionalAssistance: getMemberValue<string | null>(record, 'additional_assistance') || null,
        },
      };
    });
  } catch (err) {
    console.error('[getMembers] Unexpected error:', err);
    return [];
  }
}
