import { redirect } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validatePin } from './actions';

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
  };
}

export default async function PinPage({ searchParams }: PinPageProps): Promise<JSX.Element> {
  const { userId, error, remaining } = searchParams;

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Enter PIN</h1>
        <p className="mb-6 text-center text-sm text-gray-600">{profile.display_name}</p>

        {error === 'invalid' && (
          <div
            role="alert"
            className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Incorrect PIN.{' '}
            {remainingCount !== null && remainingCount > 0
              ? `${remainingCount} attempt${remainingCount === 1 ? '' : 's'} remaining.`
              : ''}
          </div>
        )}

        {error && error !== 'invalid' && (
          <div role="alert" className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            An error occurred. Please try again.
          </div>
        )}

        <form action={validatePin}>
          <input type="hidden" name="profileId" value={profile.id} />

          <div className="mb-6 flex justify-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                name={`digit_${index}`}
                aria-label={`PIN digit ${index + 1}`}
                className="h-14 w-14 rounded-lg border-2 border-gray-300 text-center text-2xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                autoComplete="off"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Confirm PIN
          </button>
        </form>
      </div>
    </main>
  );
}
