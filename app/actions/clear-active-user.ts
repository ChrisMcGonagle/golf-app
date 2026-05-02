'use server';

import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

interface IronSessionData {
  activeUser?: {
    profileId: string;
    displayName: string;
    role: string;
    expiresAt: number;
  };
}

const COOKIE_NAME = 'activeUser';

export async function clearActiveUser(): Promise<{ success: true }> {
  const secret = process.env.ACTIVE_USER_SECRET;
  if (!secret) {
    throw new Error('ACTIVE_USER_SECRET is not set');
  }

  const cookieStore = cookies();
  const session = await getIronSession<IronSessionData>(cookieStore, {
    cookieName: COOKIE_NAME,
    password: secret,
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    },
  });

  session.destroy();

  return { success: true };
}
