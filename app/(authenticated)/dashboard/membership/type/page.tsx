import Link from 'next/link';

type MembershipIntent = 'new' | 'renewal';

type MembershipTypePageProps = {
  searchParams: Promise<{
    intent?: string;
    memberId?: string;
  }>;
};

const membershipTypes = [
  {
    id: 'full',
    title: 'Full',
    description: 'Full membership with all club privileges',
    icon: 'crown',
  },
  {
    id: 'senior',
    title: 'Senior',
    description: 'For members aged 65 and over',
    icon: 'person-senior',
  },
  {
    id: 'student',
    title: 'Student',
    description: 'For full-time students',
    icon: 'graduation-cap',
  },
  {
    id: 'juvenile',
    title: 'Juvenile',
    description: 'For members aged 10-17',
    icon: 'person-junior',
  },
  {
    id: 'family',
    title: 'Family',
    description: 'For family groups',
    icon: 'people',
  },
  {
    id: 'overseas',
    title: 'Overseas',
    description: 'For members living outside the UK',
    icon: 'globe',
  },
  {
    id: 'beginner-year1',
    title: 'Beginner (Year 1)',
    description: 'First year membership for beginners',
    icon: 'medal',
  },
  {
    id: 'beginner-year2',
    title: 'Beginner (Year 2)',
    description: 'Second year membership for beginners',
    icon: 'medal',
  },
];

function MembershipTypeIcon({ iconType }: { iconType: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    crown: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1l3 7h7l-5.5 4 2 7L12 15l-8.5 4 2-7-5.5-4h7z" />
      </svg>
    ),
    globe: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    medal: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="7" r="5" />
        <circle cx="17" cy="7" r="5" />
        <path d="M12 2v6" />
        <path d="M7 12c-2.667 2-4 4-4 6 0 1.105.895 2 2 2h10c1.105 0 2-.895 2-2 0-2-1.333-4-4-6" />
      </svg>
    ),
    'person-senior': (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M9 13h6" />
      </svg>
    ),
    person: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    'person-junior': (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="6" r="3" />
        <path d="M18 13v-3h-3v3" />
        <path d="M6 13v-3H3v3" />
        <path d="M12 13v6a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3" />
        <path d="M12 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3" />
      </svg>
    ),
    'graduation-cap': (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6m0 0a10 10 0 0 1-5.93 8.92l-1.31-.66a10 10 0 0 0-11.55 0l-1.31.66A10 10 0 0 1 2 16" />
        <path d="M6 10l6-4 6 4" />
        <path d="M12 7v6" />
      </svg>
    ),
    people: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    building: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="2" width="18" height="20" rx="2" ry="2" />
        <line x1="9" y1="2" x2="9" y2="22" />
        <line x1="15" y1="2" x2="15" y2="22" />
        <line x1="3" y1="7" x2="21" y2="7" />
        <line x1="3" y1="13" x2="21" y2="13" />
      </svg>
    ),
    link: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    'arrow-up-right': (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    ),
    briefcase: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    star: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 10.26 24 10.27 17.18 16.70 20.27 25 12 19.54 3.73 25 6.82 16.70 0 10.27 8.91 10.26 12 2" />
      </svg>
    ),
  };

  return iconMap[iconType] || iconMap.person;
}

export default async function MembershipTypePage({ searchParams }: MembershipTypePageProps) {
  const { intent, memberId } = await searchParams;
  const resolvedIntent: MembershipIntent = intent === 'renewal' ? 'renewal' : 'new';

  const buildNavigationUrl = (typeId: string) => {
    const params = new URLSearchParams({
      intent: resolvedIntent,
      typeId,
      step: '1',
    });

    if (memberId) {
      params.set('memberId', memberId);
    }

    return `/dashboard/membership/form?${params.toString()}`;
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-8 py-16"
      style={{ backgroundColor: '#f5f6f5' }}
    >
      <div className="w-full max-w-[1000px]">
        <div className="mb-16 w-full">
          <p style={{ color: '#bab9bd' }} className="text-6xl font-normal">
            Choose a
          </p>
          <h1 style={{ color: '#2b2b2b' }} className="mt-2 text-6xl font-normal">
            Membership Type
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full">
          {membershipTypes.map((type) => (
            <Link
              key={type.id}
              href={buildNavigationUrl(type.id)}
              className="flex cursor-pointer flex-row items-center justify-start rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eeeeee',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                className="flex flex-shrink-0 h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: '#f0f0f0' }}
              >
                <MembershipTypeIcon iconType={type.icon} />
              </div>

              <div className="ml-4 flex flex-col items-start justify-center">
                <h2 style={{ color: '#282828' }} className="text-lg font-semibold">
                  {type.title}
                </h2>
                <p style={{ color: '#969696' }} className="mt-1 text-sm font-normal">
                  {type.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="fixed bottom-10 left-8 z-10">
        <Link
          href={`/dashboard/membership-flow?intent=${resolvedIntent}${memberId ? `&memberId=${memberId}` : ''}`}
          aria-label="Back to membership flow"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#969696] transition-colors hover:text-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f5]"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back</span>
        </Link>
      </div>
    </div>
  );
}
