import { redirect } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyIdentity, savePin } from './actions';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  display_name: string;
  pin_hash: string | null;
}

interface SetupPinPageProps {
  searchParams: Promise<{ userId?: string; step?: string; error?: string }>;
}

export default async function SetupPinPage({ searchParams }: SetupPinPageProps): Promise<JSX.Element> {
  const { userId, step, error } = await searchParams;

  // Guard: no userId → redirect to select-user
  if (!userId) {
    redirect('/select-user');
  }

  let profile: Profile;

  try {
    const supabase = createServiceRoleClient();
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, display_name, pin_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !data) {
      redirect('/select-user');
    }

    profile = data as Profile;
  } catch {
    redirect('/select-user');
  }

  // Guard: PIN already set → redirect to /pin
  if (profile.pin_hash !== null) {
    redirect(`/pin?userId=${userId}`);
  }

  // Step 2: PIN entry form
  if (step === '2') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Set Your PIN</h1>
          <p className="mb-6 text-center text-sm text-gray-600">{profile.display_name}</p>

          {error === 'pin_mismatch' && (
            <div role="alert" className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
              PINs do not match. Please try again.
            </div>
          )}

          {error === 'pin_invalid' && (
            <div role="alert" className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
              PIN must be exactly 4 numeric digits.
            </div>
          )}

          <form action={savePin}>
            <input type="hidden" name="userId" value={profile.id} />

            <p className="mb-2 text-sm font-medium text-gray-700">Enter PIN</p>
            <div className="mb-4 flex justify-center gap-3">
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

            <p className="mb-2 text-sm font-medium text-gray-700">Confirm PIN</p>
            <div className="mb-6 flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  name={`confirm_${index}`}
                  aria-label={`Confirm PIN digit ${index + 1}`}
                  className="h-14 w-14 rounded-lg border-2 border-gray-300 text-center text-2xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                  autoComplete="off"
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none"
            >
              Set PIN
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Step 1 (default): email + password verification form
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Verify Identity</h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Enter your email and password to set your PIN.
        </p>

        {error === 'invalid_credentials' && (
          <div role="alert" className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            Invalid email or password. Please try again.
          </div>
        )}

        {error === 'email_mismatch' && (
          <div role="alert" className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            The credentials provided do not match this account.
          </div>
        )}

        <form action={verifyIdentity}>
          <input type="hidden" name="userId" value={profile.id} />

          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none"
          >
            Verify
          </button>
        </form>
      </div>
    </main>
  );
}
