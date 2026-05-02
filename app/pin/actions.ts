'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface ActiveUserSession {
  profileId: string;
  displayName: string;
  role: string;
  expiresAt: number;
}

interface IronSessionData {
  activeUser?: ActiveUserSession;
}

const COOKIE_NAME = 'activeUser';
const MAX_FAIL_COUNT = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours in seconds

export async function validatePin(formData: FormData): Promise<never> {
  // Dynamically import bcrypt to avoid native module issues on Vercel
  const bcrypt = await import('bcrypt');
  
  const profileId = formData.get('profileId');

  // Validate profileId is a string
  if (typeof profileId !== 'string') {
    redirect('/select-user');
  }

  const trimmedProfileId = profileId.trim();

  // Combine four individual digit inputs into a single PIN string
  const d0 = formData.get('digit_0');
  const d1 = formData.get('digit_1');
  const d2 = formData.get('digit_2');
  const d3 = formData.get('digit_3');

  if (
    typeof d0 !== 'string' ||
    typeof d1 !== 'string' ||
    typeof d2 !== 'string' ||
    typeof d3 !== 'string'
  ) {
    redirect(`/pin?userId=${trimmedProfileId}&error=invalid&remaining=5`);
  }

  const pin = `${d0}${d1}${d2}${d3}`;

  // Validate PIN is exactly 4 numeric digits — never expose the raw value in redirects or logs
  if (!/^\d{4}$/.test(pin)) {
    redirect(`/pin?userId=${trimmedProfileId}&error=invalid&remaining=5`);
  }

  const supabase = createServiceRoleClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, pin_hash, pin_fail_count, pin_locked_until')
    .eq('id', trimmedProfileId)
    .single();

  if (error || !profile) {
    redirect('/select-user');
  }

  // Check lockout
  if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
    redirect('/select-user?error=locked');
  }

  // bcrypt compare — server-side only, pin never stored or logged
  const isValid = await bcrypt.compare(pin, profile.pin_hash as string);

  if (isValid) {
    // Reset fail count
    await supabase
      .from('profiles')
      .update({ pin_fail_count: 0 })
      .eq('id', trimmedProfileId);

    // Set iron-session cookie
    const cookieStore = cookies();
    const session = await getIronSession<IronSessionData>(cookieStore, {
      cookieName: COOKIE_NAME,
      password: process.env.ACTIVE_USER_SECRET as string,
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    });

    session.activeUser = {
      profileId: trimmedProfileId,
      displayName: profile.display_name as string,
      role: profile.role as string,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    await session.save();

    redirect('/staff');
  }

  // PIN incorrect — increment fail count
  const newFailCount = (profile.pin_fail_count as number) + 1;

  if (newFailCount >= MAX_FAIL_COUNT) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();

    await supabase
      .from('profiles')
      .update({ pin_locked_until: lockedUntil, pin_fail_count: 0 })
      .eq('id', trimmedProfileId);

    redirect('/select-user?error=locked');
  }

  await supabase
    .from('profiles')
    .update({ pin_fail_count: newFailCount })
    .eq('id', trimmedProfileId);

  redirect(`/pin?userId=${trimmedProfileId}&error=invalid&remaining=${MAX_FAIL_COUNT - newFailCount}`);
}
