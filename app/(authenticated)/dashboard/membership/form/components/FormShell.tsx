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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <StepIndicator currentStep={currentStep} />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {renderStep()}
      </div>

      <div className="mt-8 flex justify-between gap-4">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            disabled={!isValid}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            disabled
            className="rounded-lg bg-gray-400 px-6 py-2 font-medium text-white cursor-not-allowed"
          >
            Complete (Coming Soon)
          </button>
        )}
      </div>
    </div>
  );
}
