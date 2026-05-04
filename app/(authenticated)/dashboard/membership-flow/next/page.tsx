import { redirect } from 'next/navigation';

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

  const validIntent = intent === 'new' || intent === 'renewal';
  const validAction = action === 'form' || action === 'email';

  if (!validIntent || !validAction) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invalid flow parameters</h1>
        <p className="text-gray-600">Please return to the membership flow and try again.</p>
      </div>
    );
  }

  if (intent === 'new') {
    redirect(`/dashboard/membership/type?intent=new&action=${action}`);
  }

  redirect(`/dashboard/membership/member-search?intent=renewal&action=${action}`);
}