'use client';

import Link from 'next/link';

interface PersonalData {
  firstName?: string;
  phone?: string;
  surname?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  country?: string;
}

interface MembershipData {
  homeClub?: string;
  handicapIndex?: string | number;
}

interface FlowData {
  typeId?: string;
}

interface Payload {
  personal?: PersonalData;
  membership?: MembershipData;
  flow?: FlowData;
  formSubmittedAt?: string;
  [key: string]: unknown;
}

interface MembershipSuccessSummaryProps {
  payload: Payload | null;
  showSummaryPanel?: boolean;
}

export default function MembershipSuccessSummary({
  payload,
  showSummaryPanel = true,
}: MembershipSuccessSummaryProps) {
  if (!payload) {
    return null;
  }

  const personal = payload.personal as PersonalData | undefined;
  const membership = payload.membership as MembershipData | undefined;
  const flow = payload.flow as FlowData | undefined;

  const firstName = personal?.firstName || '';
  const surname = personal?.surname || '';
  const phone = personal?.phone || '';
  const email = personal?.email || '';
  const homeClub = membership?.homeClub?.toString().trim() || 'Cruit Island';
  const handicapIndexValue = membership?.handicapIndex;
  const handicapIndex = handicapIndexValue?.toString().trim() ? handicapIndexValue : 'N/A';
  const membershipTypeSource = flow?.typeId
    ?.replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '';
  const normalizedMembershipType = membershipTypeSource.replace(/\b(member|membership)\b\s*$/i, '').trim();
  const membershipType = `${(normalizedMembershipType || membershipTypeSource || 'Golf Club').toUpperCase()} MEMBERSHIP`;
  const fullName = [firstName, surname].filter(Boolean).join(' ') || 'Member';
  const addressLine = [
    personal?.address1,
    personal?.address2,
    personal?.city,
    personal?.county,
    personal?.postalCode,
    personal?.country,
  ].filter(Boolean).join(', ');
  const expiryBaseDate = payload.formSubmittedAt ? new Date(payload.formSubmittedAt) : new Date();
  const expiryDate = Number.isNaN(expiryBaseDate.getTime()) ? new Date() : expiryBaseDate;
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const membershipExpiry = expiryDate.toLocaleDateString();
  const submissionDate = expiryBaseDate.toLocaleDateString();
  const signatureName = "Rory O'Neill";
  const handwrittenStyle = {
    fontFamily: '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive',
  } as React.CSSProperties;
  const sectionBodyClassName = 'mt-3 bg-[#f7f7f7] p-2 text-[0.95rem] leading-7 text-[#2b2b2b]';
  const sectionRowClassName = 'border-b border-[#eeeeee] px-4 py-3 last:border-b-0 sm:px-5';
  const summaryGeometry = {
    '--success-card-height': 'clamp(240px, 32vh, 280px)',
    '--success-card-half-height': 'clamp(120px, 16vh, 140px)',
    '--success-card-top': 'calc(28vh - clamp(120px, 16vh, 140px))',
    '--success-panel-offset': 'calc(28vh + clamp(120px, 16vh, 140px) - 1px)',
  } as React.CSSProperties;

  return (
    <>
      <style>{`
        @keyframes summaryPanelReveal {
          0% {
            opacity: 0;
            transform: translateY(26px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="relative min-h-screen bg-[#f5f6f5] px-4 pb-10 sm:px-6 sm:pb-12" style={summaryGeometry}>
        <Link
          href="/dashboard/membership-registration"
          aria-label="Close success page"
          className="fixed left-4 top-4 z-30 inline-flex h-8 w-8 items-center justify-center text-base font-medium leading-none text-[#5f6a60] transition-colors hover:text-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#5f6a60]/30 sm:left-6 sm:top-6"
        >
          X
        </Link>
        <div className="relative mx-auto min-h-screen w-full max-w-[720px]">
          <div
            className="absolute left-1/2 w-full -translate-x-1/2 bg-gray-400 shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
            style={{ top: 'var(--success-card-top)', height: 'var(--success-card-height)' }}
          >
            <div className="flex h-full items-end justify-start px-5 pb-9 pt-6 text-white sm:px-6 sm:pb-10 sm:pt-8 md:px-8">
              <div className="w-full max-w-[520px] text-left">
                <p className="whitespace-nowrap text-xl font-semibold tracking-[0.02em] sm:text-[1.75rem]">Great! You&apos;re all set.</p>
                <div className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
                  <p className="block whitespace-nowrap">You are now a member of Cruit Island Golf Club</p>
                  <p className="block whitespace-nowrap">You will receive an email within 24 hours with your membership details.</p>
                  <p className="block whitespace-nowrap">If any additional information is required, we will be in touch.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-screen flex-col" style={{ paddingTop: 'var(--success-panel-offset)' }}>
            <div
              aria-hidden={!showSummaryPanel}
              className="w-full bg-white p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06)] sm:p-8"
              style={showSummaryPanel
                ? {
                  opacity: 0,
                  transform: 'translateY(26px)',
                  animation: 'summaryPanelReveal 620ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both',
                }
                : {
                  opacity: 0,
                  transform: 'translateY(26px)',
                  visibility: 'hidden',
                }}
            >
              <div className="space-y-6">
                <section>
                  <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#5f6a60]">Member Details</h2>
                  <div className={sectionBodyClassName}>
                    <p className={sectionRowClassName}>{fullName}</p>
                    {phone ? <p className={sectionRowClassName}>{phone}</p> : null}
                    {email ? <p className={sectionRowClassName}>{email}</p> : null}
                    {addressLine ? <p className={sectionRowClassName}>{addressLine}</p> : null}
                  </div>
                </section>

                <section>
                  <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#5f6a60]">Membership Details</h2>
                  <div className={sectionBodyClassName}>
                    <p className={`${sectionRowClassName} font-medium tracking-[0.02em] text-[#2b2b2b]`}>{membershipType} (until {membershipExpiry})</p>
                    <p className={`${sectionRowClassName} flex items-center justify-between gap-4 text-[#2b2b2b]`}>
                      <span>Home Club</span>
                      <span className="text-right">{homeClub}</span>
                    </p>
                    <p className={`${sectionRowClassName} flex items-center justify-between gap-4 text-[#2b2b2b]`}>
                      <span>Handicap Index</span>
                      <span className="text-right">{handicapIndex}</span>
                    </p>
                    <p className={`${sectionRowClassName} flex items-center justify-between gap-4 text-[#2b2b2b]`}>
                      <span>Status</span>
                      <span className="text-right">PAID</span>
                    </p>
                  </div>
                  <div className="mt-4 px-4 text-[#5f645f] sm:px-5">
                    <div className="pt-4 text-sm">
                      <div className="flex items-end justify-between gap-6">
                        <div className="flex min-w-0 flex-1 items-end gap-3">
                          <span className="shrink-0 font-medium">Signed:</span>
                          <div className="relative flex-1 border-b border-[#c9cec8] pb-1">
                            <span className="block text-[1.45rem] leading-none text-[#435045]" style={handwrittenStyle}>{signatureName}</span>
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-1 items-end justify-end gap-3">
                          <span className="shrink-0 font-medium">Date:</span>
                          <div className="relative flex-1 border-b border-[#c9cec8] pb-1">
                            <span className="block text-[1.25rem] leading-none text-[#4d5b4e]" style={handwrittenStyle}>{submissionDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-5 text-center text-[0.68rem] leading-5 text-[#6f756f] sm:text-[0.76rem]">
                    A copy of these membership details will also be sent to your email for your records.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
