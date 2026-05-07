'use client';

import Image from 'next/image';
import { useLayoutEffect, useRef, useState } from 'react';

type AccountFilter = 'All' | 'Admin' | 'Staff' | 'Competitions' | 'Handicapping' | 'Course' | 'Teams';

type AccountRow = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email: string;
  phoneNumber: string;
  status: 'Active' | 'Disabled';
  role: 'Admin' | 'Staff';
  permissions: string[];
};

const PERMISSIONS_CHIP_GAP_PX = 4;
const PERMISSIONS_MORE_GAP_PX = 8;
const DEFAULT_VISIBLE_PERMISSIONS = 3;
const permissionChipClassName =
  'inline-flex shrink-0 items-center rounded-lg bg-gray-900 px-2.5 pt-[0.35rem] pb-[0.35rem] text-xs font-medium text-white';
const morePermissionsButtonClassName =
  'inline-flex shrink-0 items-center text-xs font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700';

function getVisiblePermissionCount(
  permissionWidths: number[],
  moreWidthsByRemaining: Record<number, number>,
  containerWidth: number,
  chipGapPx: number,
  moreGapPx: number,
) {
  if (containerWidth <= 0) {
    return 0;
  }

  for (let visibleCount = permissionWidths.length; visibleCount >= 0; visibleCount -= 1) {
    const hiddenCount = permissionWidths.length - visibleCount;
    const visibleWidth = permissionWidths
      .slice(0, visibleCount)
      .reduce((total, width) => total + width, 0);

    if (hiddenCount === 0) {
      const totalWidth = visibleWidth + Math.max(visibleCount - 1, 0) * chipGapPx;

      if (totalWidth <= containerWidth) {
        return visibleCount;
      }

      continue;
    }

    const moreWidth = moreWidthsByRemaining[hiddenCount];

    if (typeof moreWidth !== 'number') {
      continue;
    }

    const chipGapsWidth = Math.max(visibleCount - 1, 0) * chipGapPx;
    const moreGapWidth = visibleCount > 0 ? moreGapPx : 0;
    const totalWidth = visibleWidth + chipGapsWidth + moreGapWidth + moreWidth;

    if (totalWidth <= containerWidth) {
      return visibleCount;
    }
  }

  return 0;
}

type AccountPermissionsInlineProps = {
  permissions: string[];
  accountName: string;
};

function measurementsMatch(
  previous: {
    containerWidth: number;
    permissionWidths: number[];
    moreWidthsByRemaining: Record<number, number>;
  },
  next: {
    containerWidth: number;
    permissionWidths: number[];
    moreWidthsByRemaining: Record<number, number>;
  },
) {
  if (previous.containerWidth !== next.containerWidth) {
    return false;
  }

  if (previous.permissionWidths.length !== next.permissionWidths.length) {
    return false;
  }

  if (
    previous.permissionWidths.some((width, index) => width !== next.permissionWidths[index])
  ) {
    return false;
  }

  const previousKeys = Object.keys(previous.moreWidthsByRemaining);
  const nextKeys = Object.keys(next.moreWidthsByRemaining);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every(
    (key) => previous.moreWidthsByRemaining[Number(key)] === next.moreWidthsByRemaining[Number(key)],
  );
}

function AccountPermissionsInline({ permissions, accountName }: AccountPermissionsInlineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const permissionMeasureRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const moreMeasureRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const permissionsKey = permissions.join('\u0000');
  const [measurements, setMeasurements] = useState<{
    containerWidth: number;
    permissionWidths: number[];
    moreWidthsByRemaining: Record<number, number>;
  }>({
    containerWidth: 0,
    permissionWidths: [],
    moreWidthsByRemaining: {},
  });

  useLayoutEffect(() => {
    function measure() {
      const nextMeasurements = {
        containerWidth: containerRef.current?.getBoundingClientRect().width ?? 0,
        permissionWidths: permissions.map(
          (_, index) => permissionMeasureRefs.current[index]?.getBoundingClientRect().width ?? 0,
        ),
        moreWidthsByRemaining: permissions.reduce<Record<number, number>>((widths, _, index) => {
          const remaining = index + 1;
          widths[remaining] =
            moreMeasureRefs.current[remaining]?.getBoundingClientRect().width ?? 0;
          return widths;
        }, {}),
      };

      setMeasurements((previous) =>
        measurementsMatch(previous, nextMeasurements) ? previous : nextMeasurements,
      );
    }

    measure();

    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [permissions, permissionsKey]);

  const hasMeasurements =
    measurements.containerWidth > 0 &&
    measurements.permissionWidths.length === permissions.length &&
    measurements.permissionWidths.every((width) => width > 0) &&
    permissions.every((_, index) => (measurements.moreWidthsByRemaining[index + 1] ?? 0) > 0);

  const visibleCount = hasMeasurements
    ? getVisiblePermissionCount(
        measurements.permissionWidths,
        measurements.moreWidthsByRemaining,
        measurements.containerWidth,
        PERMISSIONS_CHIP_GAP_PX,
        PERMISSIONS_MORE_GAP_PX,
      )
    : Math.min(DEFAULT_VISIBLE_PERMISSIONS, permissions.length);
  const hiddenCount = permissions.length - visibleCount;

  return (
    <div className="relative w-full min-w-0">
      <div ref={containerRef} className="flex min-w-0 items-center overflow-hidden whitespace-nowrap">
        {visibleCount > 0 ? (
          <div className="flex min-w-0 items-center gap-1 overflow-hidden">
            {permissions.slice(0, visibleCount).map((permission) => (
              <span key={permission} className={permissionChipClassName}>
                {permission}
              </span>
            ))}
          </div>
        ) : null}
        {hiddenCount > 0 ? (
          <button
            type="button"
            aria-label={`Show ${hiddenCount} more permissions for ${accountName}`}
            className={`${morePermissionsButtonClassName}${visibleCount > 0 ? ' ml-2' : ''}`}
          >
            {hiddenCount} more
          </button>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="absolute left-0 top-0 invisible pointer-events-none whitespace-nowrap"
      >
        <div className="flex items-center gap-1">
          {permissions.map((permission, index) => (
            <span
              key={`${permission}-${index}`}
              ref={(element) => {
                permissionMeasureRefs.current[index] = element;
              }}
              className={permissionChipClassName}
            >
              {permission}
            </span>
          ))}
          {permissions.map((_, index) => {
            const remaining = index + 1;

            return (
              <button
                key={remaining}
                type="button"
                ref={(element) => {
                  moreMeasureRefs.current[remaining] = element;
                }}
                className={morePermissionsButtonClassName}
              >
                {remaining} more
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getAccountInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const mockAccounts: AccountRow[] = [
  {
    id: 'acc-001',
    name: 'Siobhan Doherty',
    avatarUrl: null,
    email: 'siobhan.doherty@baffiegolf.com',
    phoneNumber: '(087) 512-4431',
    status: 'Active',
    role: 'Admin',
    permissions: ['admin', 'members', 'times', 'competition', 'handicapping', 'team captain'],
  },
  {
    id: 'acc-002',
    name: 'Padraig Sweeney',
    avatarUrl: null,
    email: 'padraig.sweeney@baffiegolf.com',
    phoneNumber: '(086) 274-1185',
    status: 'Active',
    role: 'Staff',
    permissions: ['members', 'times'],
  },
  {
    id: 'acc-003',
    name: 'Ciara McLaughlin',
    avatarUrl: null,
    email: 'ciara.mclaughlin@baffiegolf.com',
    phoneNumber: '(085) 661-9024',
    status: 'Active',
    role: 'Staff',
    permissions: ['members'],
  },
  {
    id: 'acc-004',
    name: 'Eoin Gallagher',
    avatarUrl: null,
    email: 'eoin.gallagher@baffiegolf.com',
    phoneNumber: '(089) 340-7762',
    status: 'Disabled',
    role: 'Staff',
    permissions: ['competition', 'handicapping', 'greenstaff'],
  },
];

const accountFilters: AccountFilter[] = [
  'All',
  'Staff',
  'Competitions',
  'Handicapping',
  'Course',
  'Teams',
];

const accountFilterHelperText: Record<AccountFilter, string> = {
  All: 'All accounts',
  Admin: 'Admin accounts',
  Staff: 'Staff accounts',
  Competitions: 'Competitions accounts',
  Handicapping: 'Handicapping accounts',
  Course: 'Course accounts',
  'Teams': 'Teams accounts',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>(mockAccounts);
  const [selectedFilter, setSelectedFilter] = useState<AccountFilter>('All');
  const selectedFilterHelperText = accountFilterHelperText[selectedFilter];

  const filteredAccounts = accounts.filter((account) => {
    switch (selectedFilter) {
      case 'All':
        return true;
      case 'Staff':
        return account.role === 'Staff';
      case 'Competitions':
        return account.permissions.includes('competition');
      case 'Handicapping':
        return account.permissions.includes('handciapping');
      case 'Course':
        return account.permissions.includes('course');
      case 'Teams':
        return account.permissions.includes('teams');
      default:
        return true;
    }
  });

  function toggleStatus(id: string) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'Active' ? 'Disabled' : 'Active' } : a,
      ),
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>

        <div className="mt-4 border-b border-gray-200">
          <div className="grid max-w-[780px] grid-cols-6 gap-2">
            {accountFilters.map((filter) => {
              const isSelected = selectedFilter === filter;
              const baseTabClassName =
                'flex h-11 w-full items-center justify-center border-b-2 px-2 pb-3 text-center text-sm leading-tight whitespace-normal';

              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedFilter(filter)}
                  className={
                    isSelected
                      ? `${baseTabClassName} -mb-px border-gray-900 font-semibold text-gray-900`
                      : `${baseTabClassName} border-transparent font-medium text-gray-500 transition hover:text-gray-700`
                  }
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="text-md font-semibold text-gray-900">{selectedFilterHelperText}</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 pt-[0.4rem] pb-[0.4rem] text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm6 1a2 2 0 100-4 2 2 0 000 4zm-6 2c-2.761 0-5 1.79-5 4v1h10v-1c0-2.21-2.239-4-5-4zm6 1c-.734 0-1.43.126-2.055.353 1.221.844 2.055 2.11 2.055 3.647h5v-.5c0-1.933-2.239-3.5-5-3.5z"
              />
            </svg>
            Invite
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table
          className="w-full table-fixed divide-y divide-gray-200"
          aria-label="Accounts table"
        >
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[20%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Phone Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Permissions
              </th>
              <th
                aria-hidden="true"
                role="presentation"
                className="px-4 py-3"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredAccounts.map((account) => (
              <tr key={account.id} className="transition hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-600">
                  <div className="flex min-w-0 items-center gap-3">
                    {account.avatarUrl ? (
                      <Image
                        src={account.avatarUrl}
                        alt=""
                        unoptimized
                        width={32}
                        height={32}
                        sizes="32px"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {getAccountInitials(account.name)}
                      </span>
                    )}
                    <span className="truncate">{account.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 [overflow-wrap:anywhere]">{account.email}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{account.phoneNumber}</td>
                <td className="px-4 py-4 text-sm">
                  <span
                    className={
                      account.status === 'Active'
                        ? 'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium border-emerald-300 bg-emerald-100 text-emerald-800'
                        : 'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium border-red-200 bg-red-50 text-red-700'
                    }
                  >
                    <span
                      aria-hidden="true"
                      className={
                        account.status === 'Active'
                          ? 'h-2 w-2 rounded-full bg-emerald-600'
                          : 'h-2 w-2 rounded-full bg-red-500'
                      }
                    />
                    <span>{account.status}</span>
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{account.role}</td>
                <td className="min-w-0 px-4 py-4">
                  <AccountPermissionsInline
                    permissions={account.permissions}
                    accountName={account.name}
                  />
                </td>
                <td className="px-4 py-4 text-right text-sm text-gray-600">
                  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    <button
                      type="button"
                      aria-label={`Edit ${account.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.586 3.586a2 2 0 112.828 2.828L7.5 15.328l-3.5.672.672-3.5 8.914-8.914z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(account.id)}
                      aria-label={
                        account.status === 'Active'
                          ? `Disable ${account.name}`
                          : `Activate ${account.name}`
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      {account.status === 'Active' ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="h-5 w-5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="h-5 w-5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}