import { createServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

// Mark as dynamic since it requires environment variables and real-time profile data
export const dynamic = 'force-dynamic';

// STEP 1: TypeScript interfaces for profile shape
interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: 'staff' | 'admin';
  pin_hash: string | null;
  pin_locked_until: string | null;
}

// STEP 5: Helper function to check if profile is locked
function isProfileLocked(profile: Profile): boolean {
  if (!profile.pin_locked_until) {
    return false;
  }
  const lockedUntil = new Date(profile.pin_locked_until);
  return lockedUntil > new Date();
}

// STEP 7: Helper function to extract initials from display name
function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

// STEP 4: Reusable Profile Card Component
interface ProfileCardProps {
  profile: Profile;
  isLocked: boolean;
}

function ProfileCard({ profile, isLocked }: ProfileCardProps): JSX.Element {
  const initials = getInitials(profile.display_name);

  // Locked cards: non-interactive
  if (isLocked) {
    return (
      <div className="h-32 rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-full flex-col items-center justify-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-gray-500">{initials}</span>
            )}
          </div>
          <h3 className="mb-2 text-center text-sm font-semibold text-gray-800">
            {profile.display_name}
          </h3>
          <span className="inline-block rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
            Locked
          </span>
        </div>
      </div>
    );
  }

  // Unlocked cards: interactive
  const href = profile.pin_hash
    ? `/pin?userId=${profile.id}`
    : `/setup-pin?userId=${profile.id}`;

  return (
    <Link href={href}>
      <div className="h-32 cursor-pointer rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-500 hover:shadow-md">
        <div className="flex h-full flex-col items-center justify-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-blue-600">{initials}</span>
            )}
          </div>
          <h3 className="text-center text-sm font-semibold text-gray-800">
            {profile.display_name}
          </h3>
        </div>
      </div>
    </Link>
  );
}

// STEP 1: Server Component Shell - accepts searchParams
interface SelectUserPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SelectUserPage({
  searchParams,
}: SelectUserPageProps): Promise<JSX.Element> {
  // STEP 2: Server-side profile fetch using service role
  let profiles: Profile[] = [];
  let fetchError: Error | null = null;

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['staff', 'admin']);

    if (error) {
      throw new Error(error.message);
    }

    profiles = (data || []) as Profile[];
  } catch (error) {
    // Log fetch error
    console.error('Failed to fetch staff profiles:', error);
    fetchError = error instanceof Error ? error : new Error('Unknown error');
  }

  // Resolve searchParams (it's a Promise in Next.js 14+)
  const params = await searchParams;
  const hasLockedError = params.error === 'locked';

  // STEP 9: Handle edge cases - no profiles
  if (profiles.length === 0 && !fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Select Staff Member</h1>
          <div className="flex items-center justify-center rounded-lg bg-white p-8 text-center">
            <p className="text-gray-600">No profiles available</p>
          </div>
        </div>
      </div>
    );
  }

  // STEP 9: Handle fetch error
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Select Staff Member</h1>
          <div className="flex items-center justify-center rounded-lg bg-white p-8 text-center">
            <p className="text-gray-600">Unable to load profiles. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Select Staff Member</h1>

        {/* STEP 3: Error message for ?error=locked */}
        {hasLockedError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            <h2 className="mb-1 font-semibold">Account Locked</h2>
            <p>This account is locked. Try again in 15 minutes.</p>
          </div>
        )}

        {/* STEP 8: Responsive grid layout */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {profiles.map((profile) => {
            // STEP 5: Determine if profile is locked
            const isLocked = isProfileLocked(profile);

            // STEP 4 & 6: Render card component
            return <ProfileCard key={profile.id} profile={profile} isLocked={isLocked} />;
          })}
        </div>
      </div>
    </div>
  );
}
