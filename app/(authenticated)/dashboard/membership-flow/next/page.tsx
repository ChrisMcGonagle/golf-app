type MembershipFlowNextPageProps = {
  searchParams: Promise<{
    intent?: string;
    action?: string;
  }>;
};

export default async function MembershipFlowNextPage({
  searchParams,
}: MembershipFlowNextPageProps) {
  const { intent, action } = await searchParams;
  const resolvedIntent = intent === 'renewal' ? 'renewal' : 'new';
  const resolvedAction = action === 'email' ? 'email' : 'form';

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-4xl font-bold text-gray-900">Membership Flow Handoff</h1>
      <p className="text-lg text-gray-600">Intent: {resolvedIntent}</p>
      <p className="text-lg text-gray-600">Action: {resolvedAction}</p>
    </div>
  );
}