import Link from 'next/link';
import { MEMBERSHIP_TYPES } from '@/lib/constants/membershipTypes';
import MembershipTypeSelector from '@/components/MembershipTypeSelector';

type MembershipTypePageProps = {
  searchParams: Promise<{
    intent?: string;
    action?: string;
    memberId?: string;
    memberType?: string;
    query?: string;
  }>;
};

export default async function MembershipTypePage({ searchParams }: MembershipTypePageProps) {
  const { intent, action, memberId, memberType, query } = await searchParams;

  const safeIntent = intent === 'renewal' ? 'renewal' : 'new';
  const safeAction = action === 'email' ? 'email' : 'form';

  const preSelectedType =
    memberType && (MEMBERSHIP_TYPES as readonly string[]).includes(memberType)
      ? memberType
      : null;

  const trimmedQuery = query?.trim() ?? '';
  const querySuffix = trimmedQuery ? `&query=${encodeURIComponent(trimmedQuery)}` : '';

  const backHref =
    safeIntent === 'renewal'
      ? `/dashboard/membership/member-search?intent=renewal&action=${safeAction}${querySuffix}`
      : `/dashboard/membership-flow?intent=new`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Select Membership Type</h1>
      <p className="mb-6 text-sm text-gray-500">
        Choose the membership type to proceed.
      </p>

      <MembershipTypeSelector
        types={[...MEMBERSHIP_TYPES]}
        preSelectedType={preSelectedType}
        intent={safeIntent}
        action={safeAction}
        memberId={memberId}
      />

      <div className="mt-8">
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
      </div>
    </div>
  );
}
