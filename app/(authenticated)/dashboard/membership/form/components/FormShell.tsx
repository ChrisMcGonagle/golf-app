'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from '@/components/contexts/FormContext';
import StepIndicator from './StepIndicator';
import Step1Personal from './Step1Personal';
import Step2Membership from './Step2Membership';
import Step3Safeguarding from './Step3Safeguarding';
import Step4Placeholder from './Step4Placeholder';

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
  const { flow } = useFormContext();
  const [isValid, setIsValid] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f5]">
      <div className="mx-[5rem] pt-6 pb-0 2xl:mx-[20rem]">
        <h1 className="mb-5 text-xl font-semibold tracking-[0.04em] text-[#2b2b2b]">
          {membershipTitle}
        </h1>
        <StepIndicator currentStep={currentStep} />
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
  );
}
