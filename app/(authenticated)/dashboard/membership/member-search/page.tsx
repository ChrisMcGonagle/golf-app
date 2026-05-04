import Link from 'next/link';
import MemberSearchAutocomplete from '@/components/MemberSearchAutocomplete';
import { searchMembers } from '@/lib/actions/searchMembers';

type MemberSearchPageProps = {
  searchParams: Promise<{
    intent?: string;
    action?: string;
    query?: string;
  }>;
};

export default async function MemberSearchPage({ searchParams }: MemberSearchPageProps) {
  const { intent, action, query } = await searchParams;

  const safeIntent = intent === 'renewal' ? 'renewal' : 'new';
  const safeAction = action === 'email' ? 'email' : 'form';

  const trimmedQuery = query?.trim() ?? '';
  const didSearch = trimmedQuery.length >= 2;

  const members = didSearch ? await searchMembers(trimmedQuery) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Find Member</h1>

      <MemberSearchAutocomplete
        intent={safeIntent}
        action={safeAction}
        initialQuery={query ?? ''}
        initialMembers={members}
      />

      <div className="mt-8">
        <Link
          href={`/dashboard/membership-flow?intent=renewal`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
