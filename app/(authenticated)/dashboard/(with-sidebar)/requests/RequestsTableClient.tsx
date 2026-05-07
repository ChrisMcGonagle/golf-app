'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  RequestIntentSource,
  RequestRow,
  RequestStatus,
  RequestStep,
  RequestStepState,
} from './requestsViewModel';

type RequestStatusFilter = 'All' | RequestStatus;

const filters: RequestStatusFilter[] = ['All', 'Completed', 'In Progress', 'Pending'];

const statusChipClassNames: Record<RequestStatus, string> = {
  Pending: 'border border-amber-200 bg-amber-50 text-amber-800',
  'In Progress': 'border border-blue-200 bg-blue-50 text-blue-700',
  Completed: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
};

const stepChipClassNames: Record<RequestStepState, string> = {
  completed: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  active: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border border-amber-200 bg-amber-50 text-amber-800',
  failed: 'border border-red-200 bg-red-50 text-red-700',
};

const payloadActionButtonClassName =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#2b2b2b] transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200';

const selectionDrawerTransitionDurationMs = 200;

const payloadFieldLabels = {
  name: 'Name',
  email: 'Email',
  membershipType: 'Membership type',
  phone: 'Phone',
  club: 'Club',
  notes: 'Notes',
} satisfies Record<keyof RequestRow['payload'], string>;

function extractYearFromSubmittedDate(submittedDateTime: string) {
  const yearMatch = submittedDateTime.match(/\b(\d{4})\b/);

  return yearMatch?.[1] ?? '';
}

function StepChip({ step }: { step: RequestStep }) {
  return (
    <span
      title={step.title}
      aria-label={`Step ${step.label} ${step.title}${step.state === 'failed' ? ' failed' : ''}`}
      className={`inline-flex h-9 min-w-[2.5rem] items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold ${stepChipClassNames[step.state]}`}
    >
      <span>{step.label}</span>
      {step.showWarningIcon ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M10 3l7 13H3L10 3z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 8v3.5" strokeLinecap="round" />
          <circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      ) : null}
    </span>
  );
}

function IntentSourceIcon({ source }: { source: RequestIntentSource }) {
  if (source === 'email') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 shrink-0 text-[#2b2b2b]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="2" y="3.25" width="12" height="9.5" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.25 4.5L8 8l4.75-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0 text-[#2b2b2b]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 2.75h4l2 2v8.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2.75v2h2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.75 8h4.5" strokeLinecap="round" />
      <path d="M5.75 10.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

export function RequestsTableClient({ rows }: { rows: RequestRow[] }) {
  const pageSize = 5;
  const currentYear = String(new Date().getFullYear());
  const [activeFilter, setActiveFilter] = useState<RequestStatusFilter>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [currentPage, setCurrentPage] = useState(1);
  const [payloadRow, setPayloadRow] = useState<RequestRow | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isSelectionDrawerMounted, setIsSelectionDrawerMounted] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const availableYears = useMemo(() => {
    const years = new Set<string>([currentYear]);

    rows.forEach((row) => {
      const extractedYear = extractYearFromSubmittedDate(row.submittedDateTime);

      if (extractedYear) {
        years.add(extractedYear);
      }
    });

    return Array.from(years).sort((left, right) => Number(right) - Number(left));
  }, [currentYear, rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus = activeFilter === 'All' || row.status === activeFilter;
      const matchesYear = extractYearFromSubmittedDate(row.submittedDateTime) === selectedYear;

      if (!matchesStatus || !matchesYear) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [row.request, row.id, row.requester].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [activeFilter, rows, searchQuery, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRows]);
  const visibleRowIds = useMemo(() => paginatedRows.map((row) => row.id), [paginatedRows]);
  const selectedVisibleRowCount = useMemo(
    () => visibleRowIds.filter((rowId) => selectedRowIds.has(rowId)).length,
    [selectedRowIds, visibleRowIds],
  );
  const shouldShowSelectionDrawer = selectedVisibleRowCount > 0;
  const areAllVisibleRowsSelected =
    visibleRowIds.length > 0 && selectedVisibleRowCount === visibleRowIds.length;
  const areSomeVisibleRowsSelected =
    selectedVisibleRowCount > 0 && selectedVisibleRowCount < visibleRowIds.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = areSomeVisibleRowsSelected;
    }
  }, [areSomeVisibleRowsSelected]);

  useEffect(() => {
    let hideDrawerTimeout: ReturnType<typeof setTimeout> | undefined;

    if (shouldShowSelectionDrawer) {
      setIsSelectionDrawerMounted(true);
    } else if (isSelectionDrawerMounted) {
      hideDrawerTimeout = setTimeout(() => {
        setIsSelectionDrawerMounted(false);
      }, selectionDrawerTransitionDurationMs);
    }

    return () => {
      if (hideDrawerTimeout) {
        clearTimeout(hideDrawerTimeout);
      }
    };
  }, [isSelectionDrawerMounted, shouldShowSelectionDrawer]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, selectedYear]);

  const closePayloadDialog = () => {
    setPayloadRow(null);
  };

  const handleSelectAllVisibleRows = (checked: boolean) => {
    setSelectedRowIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (checked) {
        visibleRowIds.forEach((rowId) => {
          nextSelection.add(rowId);
        });
      } else {
        visibleRowIds.forEach((rowId) => {
          nextSelection.delete(rowId);
        });
      }

      return nextSelection;
    });
  };

  const handleRowSelectionChange = (rowId: string, checked: boolean) => {
    setSelectedRowIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (checked) {
        nextSelection.add(rowId);
      } else {
        nextSelection.delete(rowId);
      }

      return nextSelection;
    });
  };

  const handleCompleteSelectedRequests = () => {
    const selectedIds = rows
      .filter((row) => selectedRowIds.has(row.id))
      .map((row) => row.id);

    if (selectedIds.length === 0) {
      return;
    }

    if (selectedIds.length === 1) {
      console.log(selectedIds[0]);
      return;
    }

    console.log(selectedIds);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <input
          type="search"
          aria-label="Search requests"
          placeholder="Search requests…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full min-w-0 max-w-md flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
        />

        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
          <label className="flex min-w-[9rem] items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
            <select
              aria-label="Filter requests by status"
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value as RequestStatusFilter)}
              className="min-w-0 bg-transparent text-sm font-medium text-gray-900 outline-none"
            >
              {filters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[5.5rem] items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
            <select
              aria-label="Filter requests by year"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="min-w-0 bg-transparent text-sm font-medium text-gray-900 outline-none"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full table-fixed divide-y divide-gray-200" aria-label="Requests table">
          <colgroup>
            <col className="w-14" />
            <col className="w-28" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-12" />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th role="presentation" className="px-4 py-3">
                <div className="flex items-center justify-center">
                  <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    aria-label="Select all visible requests"
                    checked={areAllVisibleRowsSelected}
                    onChange={(event) => handleSelectAllVisibleRows(event.target.checked)}
                  />
                </div>
              </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Request</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Intent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Submitted Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700">Status</th>
                <th className="px-4 py-3 pr-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-700">STEP</th>
                <th aria-hidden="true" role="presentation" className="px-1 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-600">
                  No requests found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-4 align-middle text-sm text-gray-600">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        aria-label={`Select request ${row.id}`}
                        checked={selectedRowIds.has(row.id)}
                        onChange={(event) => handleRowSelectionChange(row.id, event.target.checked)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-sm font-medium text-gray-900">{row.id}</td>
                  <td className="px-4 py-4 align-middle text-sm font-medium text-gray-700 break-words">{row.request}</td>
                  <td className="px-4 py-4 align-middle text-sm text-gray-600 break-words">{row.requester}</td>
                  <td className="px-4 py-4 align-middle text-sm text-gray-600">
                    <span
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700"
                      aria-label={`${row.intent} intent via ${row.intentSource}`}
                    >
                      <span>{row.intent}</span>
                      <IntentSourceIcon source={row.intentSource} />
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-sm text-gray-600 break-words">{row.submittedDateTime}</td>
                  <td className="px-4 py-4 align-middle text-sm text-gray-600">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusChipClassNames[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 pr-1 align-middle text-sm text-gray-600">
                    <div className="flex items-center gap-2 xl:justify-end">
                      {row.steps.map((step) => (
                        <StepChip key={`${row.id}-${step.label}`} step={step} />
                      ))}
                    </div>
                  </td>
                  <td className="px-1 py-4 pr-2 align-middle text-right text-sm text-gray-600">
                    <button
                      type="button"
                      aria-label={`View payload for ${row.id}`}
                      className={payloadActionButtonClassName}
                      onClick={() => setPayloadRow(row)}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7.5 7.5h9v9h-9z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isSelectionDrawerMounted ? (
        <div
          className={`absolute -bottom-8 -left-8 -right-8 z-20 transition-all duration-200 ease-out ${shouldShowSelectionDrawer ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        >
          <div className="grid min-h-14 grid-cols-1 items-center gap-3 border-t border-gray-200 bg-white px-4 py-3 shadow-sm sm:grid-cols-3">
            <p className="text-sm font-medium text-gray-700 sm:justify-self-start">
              {selectedVisibleRowCount} of {filteredRows.length} selected
            </p>
            <div className="flex items-center justify-start gap-2 sm:justify-center">
              <button
                type="button"
                onClick={handleCompleteSelectedRequests}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Complete
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                More Actions
              </button>
            </div>
            <div aria-hidden="true" className="hidden sm:block" />
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex flex-col gap-3 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <p>{`${paginatedRows.length} of ${filteredRows.length} requests`}</p>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white"
          >
            Previous
          </button>
          <p className="min-w-24 text-center text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      </div>

      {payloadRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-payload-dialog-title"
            aria-describedby="request-payload-dialog-description"
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200"
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Request payload
              </p>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <h2 id="request-payload-dialog-title" className="text-xl font-semibold text-gray-900">
                    Payload for {payloadRow.id}
                  </h2>
                  <p id="request-payload-dialog-description" className="text-sm leading-6 text-gray-600">
                    Review the submitted request data for <span className="font-semibold text-gray-900">{payloadRow.requester}</span>
                    {' '}without leaving the requests table.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Close payload dialog for ${payloadRow.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  onClick={closePayloadDialog}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 ring-1 ring-gray-100">
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(payloadRow.payload).map(([key, value]) => (
                  <div key={key} className={key === 'notes' ? 'sm:col-span-2' : ''}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                      {payloadFieldLabels[key as keyof typeof payloadFieldLabels]}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}