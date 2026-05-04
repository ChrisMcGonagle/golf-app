'use server';

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
      .select('id, member_number, first_name, last_name, membership_type')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,member_number.ilike.%${q}%`)
      .limit(20);

    if (error) {
      return [];
    }

    return (data as MemberFlowSearchResult[]) ?? [];
  } catch {
    return [];
  }
}
