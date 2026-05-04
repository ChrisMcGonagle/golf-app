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

export default async function MembershipFlowPage({
  searchParams,
}: MembershipFlowPageProps) {
  const { intent } = await searchParams;
  const resolvedIntent: MembershipIntent = intent === 'renewal' ? 'renewal' : 'new';
  const intentLabel = getIntentLabel(resolvedIntent);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
          Membership Flow
        </p>
        <h1 className="text-4xl font-bold text-gray-900">Choose Next Step</h1>
        <p className="text-lg text-gray-600">You are starting: {intentLabel}</p>
      </div>

      <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row">
        <Link
          href={`/dashboard/membership-flow/next?intent=${resolvedIntent}&action=form`}
          className="flex-1 rounded-xl bg-blue-600 px-8 py-5 text-center text-xl font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
        >
          Membership Form
        </Link>
        <Link
          href={`/dashboard/membership-flow/next?intent=${resolvedIntent}&action=email`}
          className="flex-1 rounded-xl bg-amber-500 px-8 py-5 text-center text-xl font-semibold text-gray-950 shadow-lg transition-colors hover:bg-amber-400"
        >
          Generate Email Form
        </Link>
      </div>

      <Link
        href="/dashboard/membership-registration"
        className="px-6 py-3 text-base font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Back to Membership Registration
      </Link>
    </div>
  );
}