'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';

export async function submitMembershipForm(payload: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('membership_pending')
      .insert({
        payload,
        golfireland_account: 'pending',
        brs_account: 'pending',
        clubv1_account: 'pending',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
