import Link from 'next/link';

type MembershipIntent = 'new' | 'renewal';

type MembershipFlowPageProps = {
  searchParams: Promise<{
    intent?: string;
  }>;
};

const actionCards = [
  {
    action: 'form',
    title: 'Membership Form',
    description: 'Continue into the full registration form for this journey.',
  },
  {
    action: 'email',
    title: 'Generate Email Form',
    description: 'Prepare the email handoff for the selected membership journey.',
  },
] as const;

function ActionIcon({ action }: { action: (typeof actionCards)[number]['action'] }) {
  if (action === 'email') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-8 w-8"
        style={{ color: '#969696' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-9Z" />
        <path d="m5 8 7 5 7-5" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-8 w-8"
      style={{ color: '#969696' }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 4.75h6l3 3v11.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13.5a1 1 0 0 1 1-1Z" />
      <path d="M13.5 4.75v3h3" />
      <path d="M9 11.25h6" />
      <path d="M9 14.25h6" />
    </svg>
  );
}

export default async function MembershipFlowPage({
  searchParams,
}: MembershipFlowPageProps) {
  const { intent } = await searchParams;
  const resolvedIntent: MembershipIntent = intent === 'renewal' ? 'renewal' : 'new';

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-8 py-16"
      style={{ backgroundColor: '#f5f6f5' }}
    >
      <div className="w-full max-w-[800px]">
        <div className="mb-16 w-full max-w-[800px]">
          <p style={{ color: '#bab9bd' }} className="text-6xl font-normal">
            Choose a
          </p>
          <h1 style={{ color: '#2b2b2b' }} className="mt-2 text-6xl font-normal">
            Membership Form
          </h1>
        </div>

        <div className="flex w-full max-w-[800px] flex-col gap-8">
          {actionCards.map((card) => (
            <Link
              key={card.action}
              href={`/dashboard/membership-flow/next?intent=${resolvedIntent}&action=${card.action}`}
              className="flex cursor-pointer flex-col items-start justify-start rounded-3xl p-10 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eeeeee',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: '#f0f0f0' }}
              >
                <ActionIcon action={card.action} />
              </div>

              <div className="flex flex-col items-start justify-start">
                <h2 style={{ color: '#282828' }} className="text-4xl font-semibold">
                  {card.title}
                </h2>
                <p style={{ color: '#969696' }} className="mt-2 text-xl font-normal">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="fixed bottom-10 left-8 z-10">
        <Link
          href="/dashboard/membership-registration"
          aria-label="Back to membership registration"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#969696] transition-colors hover:text-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f5]"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back</span>
        </Link>
      </div>
    </div>
  );
}