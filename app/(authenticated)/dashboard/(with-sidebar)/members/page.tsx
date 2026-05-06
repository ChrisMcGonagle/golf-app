import { createServiceRoleClient } from '@/lib/supabase/server';
import MembersClient, { type MemberRow } from './MembersClient';

export default async function MembersPage() {
  let members: MemberRow[] = [];
  let fetchError: string | null = null;

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('members')
      .select(
        'member_number, first_name, last_name, membership_type, status, email, mobile_phone, home_club, secondary_club',
      )
      .order('last_name');

    if (error) throw new Error(error.message);
    members = (data ?? []) as MemberRow[];
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Unknown error';
  }

  return <MembersClient members={members} fetchError={fetchError} />;
}
