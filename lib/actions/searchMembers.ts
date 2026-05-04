import { createServiceRoleClient } from '@/lib/supabase/server';
import type { MemberFlowSearchResult } from '@/lib/types/membershipFlow';

export async function searchMembers(query: string): Promise<MemberFlowSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim();

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('members')
      .select('id, MEMBER_NUMBER, FIRST_NAME, LAST_NAME, MEMBERSHIP_TYPE')
      .or(`FIRST_NAME.ilike.%${q}%,LAST_NAME.ilike.%${q}%,MEMBER_NUMBER.ilike.%${q}%`)
      .limit(20);

    if (error) {
      return [];
    }

    return (data as MemberFlowSearchResult[]) ?? [];
  } catch {
    return [];
  }
}
