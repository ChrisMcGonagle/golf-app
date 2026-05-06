'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  MemberFlowSearchResult,
  MembershipAction,
  MembershipIntent,
} from '@/lib/types/membershipFlow';

type MemberSearchAutocompleteProps = {
  intent: MembershipIntent;
  action: MembershipAction;
  initialQuery: string;
  initialMembers: MemberFlowSearchResult[];
};

const MEMBER_SEARCH_PATH = '/dashboard/membership/member-search';
const SEARCH_ROUTE_PATH = '/api/members/search';
const SEARCH_DEBOUNCE_MS = 300;

function buildMemberSearchUrl(intent: MembershipIntent, action: MembershipAction, query: string) {
  const params = new URLSearchParams({ intent, action });

  if (query.trim()) {
    params.set('query', query);
  }

  return `${MEMBER_SEARCH_PATH}?${params.toString()}`;
}

function buildMemberTypeUrl(
  member: MemberFlowSearchResult,
  intent: MembershipIntent,
  action: MembershipAction,
) {
  const params = new URLSearchParams({
    intent,
    action,
    memberId: member.member_number,
    memberType: member.membership_type ?? '',
  });

  return `/dashboard/membership/type?${params.toString()}`;
}

export default function MemberSearchAutocomplete({
  intent,
  action,
  initialQuery,
  initialMembers,
}: MemberSearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialMembers);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(initialQuery.trim().length >= 2);
  const isFirstSearchEffect = useRef(true);

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      return;
    }

    router.replace(buildMemberSearchUrl(intent, action, query), { scroll: false });
  }, [action, intent, query, router]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }

    if (trimmedQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${SEARCH_ROUTE_PATH}?query=${encodeURIComponent(trimmedQuery)}`,
          { cache: 'no-store' },
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const payload = (await response.json()) as { members?: MemberFlowSearchResult[] };
        setResults(payload.members ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const trimmedQuery = query.trim();
  const showDropdown = trimmedQuery.length >= 2;
  const showNoResults = hasSearched && !isLoading && results.length === 0;

  return (
    <div>
      <label htmlFor="member-search-input" className="mb-2 block text-sm font-medium text-gray-700">
        Search by name or member number
      </label>

      <div className="relative">
        <input
          id="member-search-input"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="e.g. Smith or M00123"
          autoComplete="off"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {showDropdown && (
          <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            {isLoading && (
              <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
            )}

            {!isLoading && results.length > 0 && (
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.map((member) => (
                  <li key={member.member_number}>
                    <Link
                      href={buildMemberTypeUrl(member, intent, action)}
                      className="block px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      <div className="flex items-center justify-between gap-4">
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

            {showNoResults && (
              <p className="px-4 py-3 text-sm text-gray-500">No members found.</p>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-500">Type at least 2 characters to search.</p>
    </div>
  );
}