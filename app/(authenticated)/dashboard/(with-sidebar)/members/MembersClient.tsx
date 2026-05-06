'use client';

import { useState } from 'react';

export type MemberRow = {
  member_number: string;
  first_name: string;
  last_name: string;
  membership_type: string;
  status: string;
  email: string | null;
  mobile_phone: string | null;
  home_club: string | null;
  secondary_club: string | null;
  // Not yet in schema — will be populated once the column is added
  missingRequiredInfo?: boolean;
};

function filterMembers(list: MemberRow[], query: string) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (m) =>
      String(m.first_name ?? '').toLowerCase().includes(q) ||
      String(m.last_name ?? '').toLowerCase().includes(q) ||
      String(m.member_number ?? '').toLowerCase().includes(q),
  );
}

const actionButtonClassName =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#2b2b2b] transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200';

const emergencyActionButtonClassName =
  'inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200';

const missingInfoIndicatorClassName =
  'inline-flex h-9 w-9 cursor-default items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-lg font-semibold leading-none text-amber-700 opacity-100';

type StatusAction = 'enable' | 'disable';

type StatusDialogState = {
  action: StatusAction;
  member: Pick<MemberRow, 'member_number' | 'first_name' | 'last_name'>;
};

type EmergencyDialogState = {
  member: Pick<MemberRow, 'member_number' | 'first_name' | 'last_name'>;
};

type Props = {
  members: MemberRow[];
  fetchError: string | null;
};

export default function MembersClient({ members, fetchError }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDialog, setStatusDialog] = useState<StatusDialogState | null>(null);
  const [emergencyDialog, setEmergencyDialog] = useState<EmergencyDialogState | null>(null);

  const membershipTypes = ['Type', ...Array.from(new Set(members.map((m) => m.membership_type)))];
  const statuses = ['Status', ...Array.from(new Set(members.map((m) => m.status)))];
  const filteredMembers = filterMembers(members, searchQuery);

  const handleStatusAction = (
    action: StatusAction,
    member: Pick<MemberRow, 'member_number' | 'first_name' | 'last_name'>,
  ) => {
    setStatusDialog({ action, member });
  };

  const handleEmergencyAction = (
    member: Pick<MemberRow, 'member_number' | 'first_name' | 'last_name'>,
  ) => {
    setEmergencyDialog({ member });
  };

  const closeStatusDialog = () => setStatusDialog(null);
  const closeEmergencyDialog = () => setEmergencyDialog(null);

  if (fetchError) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
        </div>
        <div className="flex items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-sm text-gray-500">Unable to load members. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <span className="inline-flex items-center gap-3 text-sm font-medium text-gray-500">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            <span>{members.length}</span>
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search members"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
        />
        <div className="relative">
          <select
            aria-label="Filter by membership type"
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
            defaultValue="Type"
          >
            {membershipTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="relative">
          <select
            aria-label="Filter by status"
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
            defaultValue="Status"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-[760px] divide-y divide-gray-200" aria-label="Members table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Member ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Member
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Membership Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Renewal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Phone Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Home Club
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                Other Clubs
              </th>
              <th className="pl-4 pr-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">
                Actions
              </th>
              <th aria-hidden="true" role="presentation" className="pl-[0.2rem] pr-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-500">
                  {members.length === 0
                    ? 'No members found.'
                    : 'No members match your search.'}
                </td>
              </tr>
            ) : null}
            {filteredMembers.map((member) => (
              <tr key={member.member_number} className="transition hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-600">{member.member_number}</td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {member.first_name} {member.last_name}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.membership_type}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.status}</td>
                <td className="px-4 py-4 text-sm text-gray-600">—</td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.email ?? '—'}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.mobile_phone ?? '—'}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.home_club ?? '—'}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.secondary_club ?? '—'}</td>
                <td className="pl-4 pr-0 py-4 text-sm text-gray-600">
                  <div className="flex items-center justify-end gap-[0.2rem]">
                    <button
                      type="button"
                      aria-label={`View details for ${member.first_name} ${member.last_name}`}
                      className={actionButtonClassName}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label={`Show emergency info for ${member.first_name} ${member.last_name}`}
                      className={emergencyActionButtonClassName}
                      onClick={() => handleEmergencyAction(member)}
                    >
                      <span aria-hidden="true">SOS</span>
                    </button>
                    {member.status === 'active' ? (
                      <button
                        type="button"
                        aria-label={`Disable ${member.first_name} ${member.last_name}`}
                        className={actionButtonClassName}
                        onClick={() => handleStatusAction('disable', member)}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8.5 12h7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : null}
                    {member.status !== 'active' ? (
                      <button
                        type="button"
                        aria-label={`Enable ${member.first_name} ${member.last_name}`}
                        className={actionButtonClassName}
                        onClick={() => handleStatusAction('enable', member)}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 8.5v7" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8.5 12h7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </td>
                <td className="pl-[0.2rem] pr-4 py-4 text-right text-sm text-gray-600">
                  {member.missingRequiredInfo ? (
                    <span className="group relative inline-flex align-middle">
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      >
                        Missing Member Details
                      </span>
                      <button
                        type="button"
                        aria-label={`Missing required info for ${member.first_name} ${member.last_name}`}
                        className={missingInfoIndicatorClassName}
                        style={{ pointerEvents: 'none' }}
                        disabled
                      >
                        <span aria-hidden="true">!</span>
                      </button>
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {statusDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-status-dialog-title"
            aria-describedby="member-status-dialog-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200"
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Member status action
              </p>
              <h2 id="member-status-dialog-title" className="text-xl font-semibold text-gray-900">
                {statusDialog.action === 'disable' ? 'Disable member' : 'Enable member'}
              </h2>
              <p id="member-status-dialog-description" className="text-sm leading-6 text-gray-600">
                You are about to {statusDialog.action}{' '}
                <span className="font-semibold text-gray-900">
                  {statusDialog.member.first_name} {statusDialog.member.last_name}
                </span>{' '}
                with membership number{' '}
                <span className="font-semibold text-gray-900">{statusDialog.member.member_number}</span>.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 ring-1 ring-gray-100">
              <p>
                <span className="font-medium text-gray-900">Member:</span>{' '}
                {statusDialog.member.first_name} {statusDialog.member.last_name}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-900">Membership number:</span>{' '}
                {statusDialog.member.member_number}
              </p>
              <p className="mt-1 capitalize">
                <span className="font-medium text-gray-900">Action:</span> {statusDialog.action}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                onClick={closeStatusDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={closeStatusDialog}
              >
                Confirm {statusDialog.action === 'disable' ? 'disable' : 'enable'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {emergencyDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-emergency-dialog-title"
            aria-describedby="member-emergency-dialog-description"
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200"
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                Emergency information
              </p>
              <h2 id="member-emergency-dialog-title" className="text-xl font-semibold text-gray-900">
                Emergency info
              </h2>
              <p id="member-emergency-dialog-description" className="text-sm leading-6 text-gray-600">
                Review safeguarding details for{' '}
                <span className="font-semibold text-gray-900">
                  {emergencyDialog.member.first_name} {emergencyDialog.member.last_name}
                </span>{' '}
                before providing assistance or contacting the emergency contact.
              </p>
            </div>

            <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 ring-1 ring-gray-100 sm:grid-cols-2">
              <p>
                <span className="font-medium text-gray-900">Member:</span>{' '}
                {emergencyDialog.member.first_name} {emergencyDialog.member.last_name}
              </p>
              <p>
                <span className="font-medium text-gray-900">Membership number:</span>{' '}
                {emergencyDialog.member.member_number}
              </p>
              <p>
                <span className="font-medium text-gray-900">Emergency contact:</span> —
              </p>
              <p>
                <span className="font-medium text-gray-900">Relationship:</span> —
              </p>
              <p>
                <span className="font-medium text-gray-900">Emergency phone:</span> —
              </p>
              <p>
                <span className="font-medium text-gray-900">Medical conditions:</span> —
              </p>
              <p>
                <span className="font-medium text-gray-900">Allergies:</span> —
              </p>
              <p>
                <span className="font-medium text-gray-900">Medications:</span> —
              </p>
              <p className="sm:col-span-2">
                <span className="font-medium text-gray-900">Additional assistance:</span> —
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                onClick={closeEmergencyDialog}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
