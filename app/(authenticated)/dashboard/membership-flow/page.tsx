import Link from 'next/link';

type MembershipIntent = 'new' | 'renewal';

type MembershipFlowPageProps = {
  searchParams: Promise<{
    intent?: string;
  }>;
};

function getIntentLabel(intent: MembershipIntent) {
  return intent === 'renewal' ? 'Membership Renewal' : 'New Membership';
}

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
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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
  const intentLabel = getIntentLabel(resolvedIntent);

  return (
    <div className="min-h-[80vh] bg-[#f5f6f5] px-6 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto flex min-h-[calc(80vh-5rem)] w-full max-w-[460px] flex-col justify-center gap-8">
        <div className="space-y-3">
          <div className="space-y-1 leading-none">
            <p className="text-[2.6rem] font-medium tracking-[-0.05em] text-[#bab9bd]">
              Choose a
            </p>
            <h1 className="text-[2.6rem] font-medium tracking-[-0.05em] text-[#2b2b2b]">
              Membership Form
            </h1>
          </div>
          <p className="text-sm text-[#969696]">You are starting: {intentLabel}</p>
        </div>

        <div className="flex flex-col gap-4">
          {actionCards.map((card) => (
            <Link
              key={card.action}
              href={`/dashboard/membership-flow/next?intent=${resolvedIntent}&action=${card.action}`}
              className="group flex items-center gap-4 rounded-[24px] border border-[#eeeeee] bg-[#ffffff] px-5 py-5 shadow-[0_12px_30px_rgba(43,43,43,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(43,43,43,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f5]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] text-[#282828]">
                <ActionIcon action={card.action} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-lg font-medium text-[#282828]">{card.title}</p>
                <p className="text-sm leading-6 text-[#969696]">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="pt-1">
          <Link
            href="/dashboard/membership-registration"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#969696] transition-colors hover:text-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f5]"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to Membership Registration</span>
          </Link>
        </div>
      </div>
    </div>
  );
}