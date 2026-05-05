'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import StepIndicator from './StepIndicator';
import Step1Personal from './Step1Personal';
import Step2Membership from './Step2Membership';
import Step3Safeguarding from './Step3Safeguarding';
import Step4Placeholder from './Step4Placeholder';

interface FormShellProps {
  currentStep: number;
}

export default function FormShell({
  currentStep,
}: FormShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isValid, setIsValid] = useState(false);

  const handleNext = () => {
    if (!isValid) return;
    if (currentStep < 4) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('step', String(currentStep + 1));
      router.push(`?${newParams.toString()}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('step', String(currentStep - 1));
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
          <Step4Placeholder />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f5]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <StepIndicator currentStep={currentStep} />

      <div className="rounded-2xl border border-[#eeeeee] bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        {renderStep()}
      </div>

      <div className="mt-8 flex justify-between gap-4">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-lg border border-[#eeeeee] bg-white px-6 py-2 font-medium text-[#2b2b2b] hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

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
            disabled
            className="rounded-lg bg-[#969696] px-6 py-2 font-medium text-white cursor-not-allowed"
          >
            Complete (Coming Soon)
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
