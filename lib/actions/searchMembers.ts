import { createServiceRoleClient } from '@/lib/supabase/server';
import type { MemberFlowSearchResult } from '@/lib/types/membershipFlow';

export async function searchMembers(query: string): Promise<MemberFlowSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim();

  try {
    const supabase = createServiceRoleClient();
    const nameFilter = `first_name.ilike.%${q}%,last_name.ilike.%${q}%`;
    const filter = /^\d+$/.test(q) ? `${nameFilter},member_number.eq.${q}` : nameFilter;

    const { data, error } = await supabase
      .from('members')
      .select('member_number, first_name, last_name, membership_type')
      .or(filter)
      .limit(20);

    if (error) {
      console.error('[searchMembers] Supabase error:', error.message, error.code);
      return [];
    }

    return (data as MemberFlowSearchResult[]) ?? [];
  } catch (err) {
    console.error('[searchMembers] Unexpected error:', err);
    return [];
  }
}
