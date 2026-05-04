import { createServiceRoleClient } from '@/lib/supabase/server';
import type { MemberFlowSearchResult } from '@/lib/types/membershipFlow';

export async function searchMembers(query: string): Promise<MemberFlowSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim();

  try {
    const supabase = createServiceRoleClient();
    const nameFilter = `"FIRST_NAME".ilike.%${q}%,"LAST_NAME".ilike.%${q}%`;
    const filter = /^\d+$/.test(q) ? `${nameFilter},"MEMBER_NUMBER".eq.${parseInt(q, 10)}` : nameFilter;

    const { data, error } = await supabase
      .from('members')
      .select('"MEMBER_NUMBER", "FIRST_NAME", "LAST_NAME", "MEMBERSHIP_TYPE"')
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
