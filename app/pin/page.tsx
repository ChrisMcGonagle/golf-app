import { redirect } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validatePin } from './actions';
import PinEntryScreen from './components/PinEntryScreen';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  display_name: string;
  pin_hash: string | null;
  pin_locked_until: string | null;
}

interface PinPageProps {
  searchParams: {
    userId?: string;
    error?: string;
    remaining?: string;
    attempt?: string;
  };
}

export default async function PinPage({ searchParams }: PinPageProps): Promise<JSX.Element> {
  const { userId, error, remaining, attempt } = searchParams;

  // Guard: no userId → redirect to select-user
  if (!userId) {
    redirect('/select-user');
  }

  let profile: Profile;

  try {
    const supabase = createServiceRoleClient();
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, display_name, pin_hash, pin_locked_until')
      .eq('id', userId)
      .single();

    if (fetchError || !data) {
      redirect('/select-user');
    }

    profile = data as Profile;
  } catch {
    redirect('/select-user');
  }

  // Guard 1: profile is locked → redirect to /select-user?error=locked
  if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
    redirect('/select-user?error=locked');
  }

  // Guard 2: no pin_hash → redirect to /setup-pin
  if (profile.pin_hash === null) {
    redirect(`/setup-pin?userId=${userId}`);
  }

  const remainingCount = remaining ? parseInt(remaining, 10) : null;
  const attemptCount = attempt ? parseInt(attempt, 10) : 0;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6"
      style={{ backgroundColor: '#f5f6f5' }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-semibold tracking-[-0.02em] text-[#2b2b2b] sm:text-[2rem]">
          Hi {profile.display_name}, enter your PIN
        </h1>
        <p className="mb-6 mt-3 text-center text-sm leading-6" style={{ color: '#969696' }}>
          Please enter your 4-digit PIN code to verify it&apos;s you.
        </p>

        <PinEntryScreen
          action={validatePin}
          profileId={profile.id}
          error={error}
          remaining={remainingCount}
          attempt={attemptCount}
        />
      </div>
    </main>
  );
}
