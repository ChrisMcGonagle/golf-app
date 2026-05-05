import { cookies } from 'next/headers';
import { unsealData } from 'iron-session';
import type { ActiveUserSession } from '@/types/activeUser';

interface ActiveUserCookieSession {
  activeUser?: ActiveUserSession;
}

const COOKIE_NAME = 'activeUser';

function isValidActiveUserSession(session: ActiveUserSession | undefined): session is ActiveUserSession {
  return Boolean(
    session &&
    session.profileId &&
    session.displayName &&
    session.role &&
    typeof session.expiresAt === 'number' &&
    session.expiresAt > Date.now()
  );
}

export async function readActiveUserSessionFromCookie(
  cookieValue: string | undefined,
  password: string
): Promise<ActiveUserSession | null> {
  if (!cookieValue) {
    return null;
  }

  try {
    const session = await unsealData<ActiveUserCookieSession>(cookieValue, {
      password,
    });

    return isValidActiveUserSession(session.activeUser) ? session.activeUser : null;
  } catch {
    return null;
  }
}

export async function getActiveUserSession(): Promise<ActiveUserSession | null> {
  const password = process.env.ACTIVE_USER_SECRET;

  if (!password) {
    return null;
  }

  const cookieStore = cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;

  return readActiveUserSessionFromCookie(cookieValue, password);
}