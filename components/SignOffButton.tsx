'use client';

import { useRouter } from 'next/navigation';
import { clearActiveUser } from '@/app/actions/clear-active-user';

interface SignOffButtonProps {
  className?: string;
}

export default function SignOffButton({ className }: SignOffButtonProps) {
  const router = useRouter();

  async function handleSignOff() {
    await clearActiveUser();
    router.replace('/select-user');
  }

  return (
    <button onClick={handleSignOff} className={className} type="button">
      Sign Off
    </button>
  );
}
