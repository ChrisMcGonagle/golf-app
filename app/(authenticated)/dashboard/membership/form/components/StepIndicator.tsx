'use client';

interface StepIndicatorProps {
  currentStep: number;
}

const STEPS = [
  { number: 1, label: 'Personal Details' },
  { number: 2, label: 'Membership' },
  { number: 3, label: 'Safeguarding' },
  { number: 4, label: 'Consent' },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Step {currentStep} of 4: {STEPS[currentStep - 1]?.label}
      </h2>
      <div className="flex justify-between gap-2">
        {STEPS.map((step) => (
          <div key={step.number} className="flex-1">
            <div
              className={`h-2 rounded-full transition-colors ${
                step.number <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
