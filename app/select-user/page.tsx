import { createServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import JiggerBrand from '@/components/JiggerBrand';

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
      <div
        className="relative rounded-2xl bg-white p-6 flex flex-col items-center justify-start min-h-[260px]"
        style={{ border: '1px solid #eeeeee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <div className="flex h-36 w-36 flex-shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name}
              width={144}
              height={144}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold" style={{ color: '#969696' }}>{initials}</span>
          )}
        </div>
        <h3 className="mt-4 text-base font-semibold text-center" style={{ color: '#282828' }}>
          {profile.display_name}
        </h3>
        <div className="absolute top-4 right-4 flex items-center justify-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            style={{ color: '#969696' }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
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
      <div
        className="relative rounded-2xl bg-white p-6 flex flex-col items-center justify-start min-h-[260px] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-pointer"
        style={{ border: '1px solid #eeeeee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <div className="flex h-36 w-36 flex-shrink-0 items-center justify-center rounded-full bg-[#f0f0f0]">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name}
              width={144}
              height={144}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold" style={{ color: '#969696' }}>{initials}</span>
          )}
        </div>
        <h2 className="mt-4 text-base font-semibold text-center" style={{ color: '#282828' }}>
          {profile.display_name}
        </h2>
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
      <div className="flex flex-col items-center justify-center min-h-screen px-8 py-16" style={{ backgroundColor: '#f5f6f5' }}>
        <div className="w-full max-w-[1200px]">
          <div className="w-full max-w-[800px] mb-16">
            <p aria-hidden="true" className="invisible text-6xl font-normal">Select</p>
            <h1 className="text-6xl font-normal mt-2" style={{ color: '#2b2b2b' }}>Select User</h1>
          </div>
          <div className="flex items-center justify-center rounded-lg bg-white p-8 text-center">
            <p style={{ color: '#969696' }}>No profiles available</p>
          </div>
        </div>
      </div>
    );
  }

  // STEP 9: Handle fetch error
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 py-16" style={{ backgroundColor: '#f5f6f5' }}>
        <div className="w-full max-w-[1200px]">
          <div className="w-full max-w-[800px] mb-16">
            <p aria-hidden="true" className="invisible text-6xl font-normal">Select</p>
            <h1 className="text-6xl font-normal mt-2" style={{ color: '#2b2b2b' }}>Select User</h1>
          </div>
          <div className="flex items-center justify-center rounded-lg bg-white p-8 text-center">
            <p style={{ color: '#969696' }}>Unable to load profiles. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-8 py-16" style={{ backgroundColor: '#f5f6f5' }}>
      <div className="absolute top-0 left-0 px-8 py-8">
        <JiggerBrand />
      </div>
      {/* Outer wrapper to contain and align heading with grid */}
      <div className="w-full max-w-[800px]">
        {/* Heading area - constrained to 800px to match other pages */}
        <div className="w-full max-w-[800px] mb-16">
          <p aria-hidden="true" className="invisible text-6xl font-normal">Select</p>
          <h1 className="text-6xl font-normal mt-2" style={{ color: '#2b2b2b' }}>Select User</h1>
        </div>

        {/* Fixed 3-column grid */}
        <div className="grid grid-cols-3 gap-8 w-full max-w-[800px]">
        {profiles.map((profile) => {
          // STEP 5: Determine if profile is locked
          const isLocked = isProfileLocked(profile);

          // STEP 4 & 6: Render card component
          return <ProfileCard key={profile.id} profile={profile} isLocked={isLocked} />;
        })}
        </div>

        {/* STEP 3: Reserved error area for ?error=locked */}
        <div className="w-full max-w-[800px] mt-6 min-h-[88px]">
          {hasLockedError && (
            <div className="rounded-lg p-4" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
              <h2 className="mb-1 font-semibold">Account Locked</h2>
              <p>This account is locked. Try again in 15 minutes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
