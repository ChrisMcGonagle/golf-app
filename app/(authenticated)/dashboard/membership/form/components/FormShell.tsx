'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from '@/components/contexts/FormContext';
import { submitMembershipForm } from '../actions';
import StepIndicator from './StepIndicator';
import Step1Personal from './Step1Personal';
import Step2Membership from './Step2Membership';
import Step3Safeguarding from './Step3Safeguarding';
import Step4Placeholder from './Step4Placeholder';
import SuccessCircleAnimation from './SuccessCircleAnimation';
import MembershipSuccessSummary from './MembershipSuccessSummary';

interface FormPayload {
  [key: string]: unknown;
}

const STEP_TITLES = [
  'PERSONAL DETAILS',
  'MEMBERSHIP DETAILS',
  'SAFEGUARDING & MEDICAL',
  'ADDITIONAL INFO & CONSENT',
];

interface FormShellProps {
  currentStep: number;
}

export default function FormShell({
  currentStep,
}: FormShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { flow, step1, step2, step3, step4 } = useFormContext();
  const [isValid, setIsValid] = useState(false);
  const [completing, setCompleting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showingSuccessAnimation, setShowingSuccessAnimation] = useState(false);
  const [showSuccessSummary, setShowSuccessSummary] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<FormPayload | null>(null);

  const membershipType = flow.typeId
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedType = membershipType.replace(/\b(member|membership)\b\s*$/i, '').trim();
  const membershipTitle = `${(normalizedType || membershipType).toUpperCase()} MEMBERSHIP`;

  const handleNext = () => {
    if (!isValid) return;
    if (currentStep < 4) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('step', String(currentStep + 1));
      router.push(`?${newParams.toString()}`);
    }
  };

  const handleComplete = async () => {
    if (!isValid) return;
    setSubmitError('');
    setCompleting(true);
    const payload = {
      flow,
      formSubmittedAt: new Date().toISOString(),
      personal: step1,
      membership: step2,
      safeguarding: step3,
      consent: step4,
    };
    try {
      const result = await submitMembershipForm(payload);
      if (result.success) {
        setSubmitted(true);
        setSubmittedPayload(payload);
        setShowingSuccessAnimation(true);
        console.log('Membership form submitted successfully');
      } else {
        setCompleting(false);
        setSubmitError(result.error ?? 'Submission failed. Please try again.');
      }
    } catch {
      setCompleting(false);
      setSubmitError('An error occurred. Please try again.');
    }
  };

  const handleAnimationComplete = () => {
    setShowingSuccessAnimation(false);
    setShowSuccessSummary(true);
  };

  const showSuccessState = showingSuccessAnimation || showSuccessSummary;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Personal
            onValidationChange={setIsValid}
          />
        );
      case 2:
        return (
          <Step2Membership
            onValidationChange={setIsValid}
          />
        );
      case 3:
        return (
          <Step3Safeguarding
            onValidationChange={setIsValid}
          />
        );
      case 4:
        return (
          <Step4Placeholder
            onValidationChange={setIsValid}
          />
        );
      default:
        return null;
    }
  };

  if (showSuccessState) {
    return (
      <div className="relative min-h-screen">
        <style>{`
          @keyframes whiteOverlayAnimation {
            0% {
              clip-path: inset(0 0 100% 0);
              opacity: 0;
            }
            12% {
              clip-path: inset(0);
              opacity: 1;
            }
            100% {
              clip-path: inset(0);
              opacity: 1;
            }
          }
        `}</style>

        <MembershipSuccessSummary
          payload={submittedPayload}
          showSummaryPanel={showSuccessSummary}
        />

        {showingSuccessAnimation ? (
          <div className="absolute inset-0 z-30">
            {/* Layer 1: Form content disabled during animation */}
            <div className="pointer-events-none flex min-h-screen flex-col">
              <div className="mx-[5rem] pt-6 pb-0 2xl:mx-[20rem]">
                <h1 className="mb-5 text-xl font-semibold tracking-[0.04em] text-[#2b2b2b]">
                  {membershipTitle}
                </h1>
                <StepIndicator currentStep={currentStep} completing={completing} />
              </div>

              <div className="w-full flex-1 bg-white">
                <div className="mx-[5rem] pt-4 pb-0 2xl:mx-[20rem]">
                  <div className="mb-4 flex items-center">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#2b2b2b]">
                      {STEP_TITLES[currentStep - 1]}
                    </p>
                    <div className="mx-4 h-3 w-px bg-[#eeeeee]" />
                    <p className="text-xs text-[#ef4444]">* are required fields</p>
                  </div>
                  <div className="border border-[#eeeeee] bg-white p-8">
                    {renderStep()}
                  </div>

                  <div className="border-x border-b border-[#eeeeee] bg-[#f5f6f5] px-8 py-4">
                    <div className="flex justify-between gap-4">
                      <Link
                        href="/dashboard/membership-registration"
                        aria-label="Back to membership registration"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#969696] transition-colors hover:text-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f5]"
                      >
                        <span aria-hidden="true">&larr;</span>
                        <span>Back</span>
                      </Link>
                      {currentStep < 4 ? (
                        <button
                          onClick={handleNext}
                          disabled={!isValid}
                          className="rounded-lg bg-[#2b2b2b] px-6 py-2 font-medium text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={handleComplete}
                          disabled={!isValid}
                          className="rounded-lg bg-[#2b2b2b] px-6 py-2 font-medium text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Complete (Coming Soon)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 2: White overlay (z-40) - sits between form and grey blind */}
            <div
              className="fixed inset-0 z-40 bg-white"
              style={{
                animation: 'whiteOverlayAnimation 3350ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
              }}
            />

            {/* Layer 3: Grey blind animation (z-50) - on top */}
            <SuccessCircleAnimation onAnimationComplete={handleAnimationComplete} success={true} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f5f6f5]">
      <div className="flex flex-1 flex-col">
        <div className="mx-[5rem] pt-6 pb-0 2xl:mx-[20rem]">
          <h1 className="mb-5 text-xl font-semibold tracking-[0.04em] text-[#2b2b2b]">
            {membershipTitle}
          </h1>
          <StepIndicator currentStep={currentStep} completing={completing} />
        </div>

        <div className="w-full flex-1 bg-white">
          <div className="mx-[5rem] pt-4 pb-0 2xl:mx-[20rem]">
            <div className="mb-4 flex items-center">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#2b2b2b]">
                {STEP_TITLES[currentStep - 1]}
              </p>
              <div className="mx-4 h-3 w-px bg-[#eeeeee]" />
              <p className="text-xs text-[#ef4444]">* are required fields</p>
            </div>
            <div className="border border-[#eeeeee] bg-white p-8">
              {renderStep()}
            </div>

            <div className="border-x border-b border-[#eeeeee] bg-[#f5f6f5] px-8 py-4">
              <div className="flex justify-between gap-4">
                <Link
                  href="/dashboard/membership-registration"
                  aria-label="Back to membership registration"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#969696] transition-colors hover:text-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f5]"
                >
                  <span aria-hidden="true">&larr;</span>
                  <span>Back</span>
                </Link>
                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    disabled={!isValid}
                    className="rounded-lg bg-[#2b2b2b] px-6 py-2 font-medium text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={!isValid}
                    className="rounded-lg bg-[#2b2b2b] px-6 py-2 font-medium text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Complete (Coming Soon)
                  </button>
                )}
              </div>
              {submitError && (
                <p className="mt-2 text-sm text-red-500">{submitError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
