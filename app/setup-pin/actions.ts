'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

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
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours in seconds

export async function verifyIdentity(formData: FormData): Promise<never> {
  const userId = formData.get('userId');
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof userId !== 'string' || !userId.trim()) {
    redirect('/select-user');
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    redirect(`/setup-pin?userId=${userId}&error=invalid_credentials`);
  }

  const trimmedUserId = userId.trim();

  const supabase = createServiceRoleClient();

  // Fetch profile to confirm it exists and pin_hash is still null
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, role, pin_hash')
    .eq('id', trimmedUserId)
    .single();

  if (profileError || !profile) {
    redirect('/select-user');
  }

  // Guard: PIN already set
  if (profile.pin_hash !== null) {
    redirect(`/pin?userId=${trimmedUserId}`);
  }

  // Authenticate using anon key (signInWithPassword requires the anon/user client)
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (authError || !authData.user) {
    redirect(`/setup-pin?userId=${trimmedUserId}&error=invalid_credentials`);
  }

  // Check the authenticated user's ID matches the profile ID
  // (profiles.id is a FK to auth.users.id)
  if (authData.user.id !== trimmedUserId) {
    redirect(`/setup-pin?userId=${trimmedUserId}&error=email_mismatch`);
  }

  redirect(`/setup-pin?userId=${trimmedUserId}&step=2`);
}

export async function savePin(formData: FormData): Promise<never> {
  const userId = formData.get('userId');

  if (typeof userId !== 'string' || !userId.trim()) {
    redirect('/select-user');
  }

  const trimmedUserId = userId.trim();

  // Combine digit inputs for PIN and PIN confirmation
  const pinDigits = ['digit_0', 'digit_1', 'digit_2', 'digit_3'].map((k) =>
    formData.get(k)
  );
  const confirmDigits = ['confirm_0', 'confirm_1', 'confirm_2', 'confirm_3'].map((k) =>
    formData.get(k)
  );

  if (pinDigits.some((d) => typeof d !== 'string') || confirmDigits.some((d) => typeof d !== 'string')) {
    redirect(`/setup-pin?userId=${trimmedUserId}&step=2&error=pin_invalid`);
  }

  const pin = (pinDigits as string[]).join('');
  const pinConfirm = (confirmDigits as string[]).join('');

  // Validate: exactly 4 numeric digits — raw PIN never in redirect URLs or logs
  if (!/^\d{4}$/.test(pin) || !/^\d{4}$/.test(pinConfirm)) {
    redirect(`/setup-pin?userId=${trimmedUserId}&step=2&error=pin_invalid`);
  }

  if (pin !== pinConfirm) {
    redirect(`/setup-pin?userId=${trimmedUserId}&step=2&error=pin_mismatch`);
  }

  const supabase = createServiceRoleClient();

  // Race guard: re-fetch to confirm pin_hash is still null
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, role, pin_hash')
    .eq('id', trimmedUserId)
    .single();

  if (profileError || !profile) {
    redirect('/select-user');
  }

  if (profile.pin_hash !== null) {
    redirect(`/pin?userId=${trimmedUserId}`);
  }

  // Hash the PIN — dynamic import to avoid native module issues
  const bcryptjs = await import('bcryptjs');
  const hash = await bcryptjs.hash(pin, 10);

  // Save the hash via service role
  await supabase
    .from('profiles')
    .update({ pin_hash: hash })
    .eq('id', trimmedUserId);

  // Set iron-session activeUser cookie (same pattern as validatePin in PBI-003b)
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
    profileId: trimmedUserId,
    displayName: profile.display_name as string,
    role: profile.role as string,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  await session.save();

  redirect('/staff');
}
