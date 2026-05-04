import Link from 'next/link';
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

      <form method="GET" action="/dashboard/membership/member-search">
        <input type="hidden" name="intent" value={safeIntent} />
        <input type="hidden" name="action" value={safeAction} />
        <label htmlFor="member-search-input" className="mb-2 block text-sm font-medium text-gray-700">
          Search by name or member number
        </label>
        <div className="flex gap-2">
          <input
            id="member-search-input"
            type="text"
            name="query"
            defaultValue={query ?? ''}
            placeholder="e.g. Smith or M00123"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </form>

      {didSearch && members.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No members found.</p>
      )}

      {members.length > 0 && (
        <ul className="mt-6 space-y-3">
          {members.map((member) => (
            <li key={member.id}>
              <Link
                href={`/dashboard/membership/type?intent=${safeIntent}&action=${safeAction}&memberId=${member.id}&memberType=${encodeURIComponent(member.membership_type ?? '')}`}
                className="block rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">Member No: {member.member_number}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {member.membership_type}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

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
