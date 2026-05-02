'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clearActiveUser } from '@/app/actions/clear-active-user';

const INACTIVITY_TIMEOUT_MS = 300_000; // 5 minutes

interface InactivityProviderProps {
  children: React.ReactNode;
}

export default function InactivityProvider({ children }: InactivityProviderProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(async () => {
        await clearActiveUser();
        router.replace('/select-user');
      }, INACTIVITY_TIMEOUT_MS);
    }

    const events = ['mousemove', 'keydown', 'pointerdown', 'touchstart'] as const;
    const options = { passive: true };

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, options);
    });

    // Start the initial timer
    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [router]);

  return <>{children}</>;
}
