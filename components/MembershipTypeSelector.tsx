'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type MembershipTypeSelectorProps = {
  types: string[];
  preSelectedType: string | null;
  intent: string;
  action: string;
  memberId: string | undefined;
};

export default function MembershipTypeSelector({
  types,
  preSelectedType,
  intent,
  action,
  memberId,
}: MembershipTypeSelectorProps) {
  const [selected, setSelected] = useState<string | null>(preSelectedType);
  const router = useRouter();

  function handleContinue() {
    if (!selected) return;

    const params = new URLSearchParams({
      intent,
      typeId: encodeURIComponent(selected),
    });

    if (memberId) {
      params.set('memberId', memberId);
    }

    router.push(`/dashboard/membership/${action}?${params.toString()}`);
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {types.map((type) => {
          const isSelected = selected === type;
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => setSelected(type)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {type}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected}
        className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
