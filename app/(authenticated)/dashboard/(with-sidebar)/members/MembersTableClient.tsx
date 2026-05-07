'use client';

import { useState } from 'react';
import type { MemberForDisplay } from '@/lib/actions/getMembers';

type StatusFilter = 'Active' | 'All' | 'Resigned';

type StatusAction = 'enable' | 'disable';

type StatusDialogState = {
  action: StatusAction;
  member: Pick<MemberForDisplay, 'id' | 'memberId' | 'name'>;
};

type EmergencyDialogState = {
  member: Pick<MemberForDisplay, 'id' | 'memberId' | 'name' | 'safeguarding'>;
};

const actionButtonClassName =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#2b2b2b] transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200';

const emergencyActionButtonClassName =
  'inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200';

const missingInfoIndicatorClassName =
  'inline-flex h-9 w-9 cursor-default items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-lg font-semibold leading-none text-amber-700 opacity-100';

export function MembersTableClient({ members }: { members: MemberForDisplay[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Active');
  const [membershipTypeFilter, setMembershipTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDialog, setStatusDialog] = useState<StatusDialogState | null>(null);
  const [emergencyDialog, setEmergencyDialog] = useState<EmergencyDialogState | null>(null);

  const handleStatusAction = (action: StatusAction, member: Pick<MemberForDisplay, 'id' | 'memberId' | 'name'>) => {
    setStatusDialog({ action, member });
  };

  const handleEmergencyAction = (member: Pick<MemberForDisplay, 'id' | 'memberId' | 'name' | 'safeguarding'>) => {
    setEmergencyDialog({ member });
  };

  const closeStatusDialog = () => {
    setStatusDialog(null);
  };

  const closeEmergencyDialog = () => {
    setEmergencyDialog(null);
  };

  // Get unique membership types for the membership filter dropdown.
  const membershipTypes = ['All', ...Array.from(new Set(members.map((member) => member.membershipType)))];
  const statuses: StatusFilter[] = ['All', 'Active', 'Resigned'];
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchTerms = normalizedSearchQuery.length === 0 ? [] : normalizedSearchQuery.split(/\s+/).filter(Boolean);
  const filteredMembers = members.filter((member) => {
    const statusMatch = statusFilter === 'All' || member.status === statusFilter;
    const typeMatch = membershipTypeFilter === 'All' || member.membershipType === membershipTypeFilter;
    const normalizedName = member.name.trim().toLowerCase();
    const normalizedMemberId = String(member.memberId ?? '').toLowerCase();
    const [commaLastName = '', commaFirstName = ''] = member.name.split(',').map((part) => part.trim().toLowerCase());
    const spaceSeparatedNameParts = member.name.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const firstName = commaFirstName || spaceSeparatedNameParts[0] || '';
    const lastName = commaFirstName
      ? commaLastName
      : spaceSeparatedNameParts.length > 1
        ? spaceSeparatedNameParts.slice(1).join(' ')
        : spaceSeparatedNameParts[0] || '';
    const combinedNameForms = [
      normalizedName,
      [firstName, lastName].filter(Boolean).join(' '),
      [lastName, firstName].filter(Boolean).join(' '),
    ];
    const searchFields = [firstName, lastName, normalizedMemberId, ...combinedNameForms].filter(Boolean);
    const searchMatch =
      searchTerms.length === 0 || searchTerms.every((term) => searchFields.some((field) => field.includes(term)));

    return statusMatch && typeMatch && searchMatch;
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 shrink-0 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <span className="inline-flex items-center gap-3 text-sm font-medium text-gray-500">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            <span>{filteredMembers.length}</span>
          </span>
        </div>
      </div>

      <div className="mb-6 shrink-0 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search members"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
        />
        <div className="relative">
          <select
            aria-label="Filter by membership type"
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
            value={membershipTypeFilter}
            onChange={(event) => setMembershipTypeFilter(event.target.value)}
          >
            {membershipTypes.map((membershipType) => (
              <option key={membershipType} value={membershipType}>
                {membershipType}
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
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
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

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="h-full overflow-y-auto">
          <div className="overflow-x-auto bg-white ring-gray-200">
            <table className="w-[912px] min-w-[912px] table-fixed divide-y divide-gray-200" aria-label="Members table">
          <colgroup>
            <col className="w-28" />
            <col className="w-48" />
            <col className="w-40" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-64" />
            <col className="w-40" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-14" />
          </colgroup>
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
              <th className="pl-4 pr-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">
                Actions
              </th>
              <th aria-hidden="true" role="presentation" className="pl-[0.2rem] pr-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-600">
                  No members match the current filters.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-600">{member.memberId}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{member.membershipType}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{member.status}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{member.renewalDate}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{member.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{member.phoneNumber}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{member.homeClub ? 'Yes' : 'No'}</td>
                  <td className="pl-4 pr-0 py-4 text-sm text-gray-600">
                    <div className="flex items-center justify-end gap-[0.2rem]">
                      <button
                        type="button"
                        aria-label={`View details for ${member.name}`}
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
                        aria-label={`Show emergency info for ${member.name}`}
                        className={emergencyActionButtonClassName}
                        onClick={() => handleEmergencyAction(member)}
                      >
                        <span aria-hidden="true">SOS</span>
                      </button>
                      {member.status === 'Active' ? (
                        <button
                          type="button"
                          aria-label={`Disable ${member.name}`}
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
                      {member.status === 'Resigned' ? (
                        <button
                          type="button"
                          aria-label={`Enable ${member.name}`}
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
                          aria-label={`Missing required info for ${member.name}`}
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
              ))
            )}
          </tbody>
            </table>
          </div>
        </div>
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
                You are about to {statusDialog.action} <span className="font-semibold text-gray-900">{statusDialog.member.name}</span>
                {' '}with membership number <span className="font-semibold text-gray-900">{statusDialog.member.memberId}</span>.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 ring-1 ring-gray-100">
              <p>
                <span className="font-medium text-gray-900">Member:</span> {statusDialog.member.name}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-900">Membership number:</span> {statusDialog.member.memberId}
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
                Review safeguarding details for <span className="font-semibold text-gray-900">{emergencyDialog.member.name}</span>
                {' '}before providing assistance or contacting the emergency contact.
              </p>
            </div>

            <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 ring-1 ring-gray-100 sm:grid-cols-2">
              <p>
                <span className="font-medium text-gray-900">Member:</span> {emergencyDialog.member.name}
              </p>
              <p>
                <span className="font-medium text-gray-900">Membership number:</span> {emergencyDialog.member.memberId}
              </p>
              <p>
                <span className="font-medium text-gray-900">Emergency contact:</span>{' '}
                {emergencyDialog.member.safeguarding.emergencyContactName || '—'}
              </p>
              <p>
                <span className="font-medium text-gray-900">Relationship:</span>{' '}
                {emergencyDialog.member.safeguarding.emergencyContactRelationship || '—'}
              </p>
              <p>
                <span className="font-medium text-gray-900">Emergency phone:</span>{' '}
                {emergencyDialog.member.safeguarding.emergencyPhone || '—'}
              </p>
              <p>
                <span className="font-medium text-gray-900">Medical conditions:</span>{' '}
                {emergencyDialog.member.safeguarding.medicalConditions || '—'}
              </p>
              <p>
                <span className="font-medium text-gray-900">Allergies:</span>{' '}
                {emergencyDialog.member.safeguarding.allergies || '—'}
              </p>
              <p>
                <span className="font-medium text-gray-900">Medications:</span>{' '}
                {emergencyDialog.member.safeguarding.medications || '—'}
              </p>
              <p className="sm:col-span-2">
                <span className="font-medium text-gray-900">Additional assistance:</span>{' '}
                {emergencyDialog.member.safeguarding.additionalAssistance || '—'}
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
