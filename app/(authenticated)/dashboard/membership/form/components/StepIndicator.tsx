'use client';

interface StepIndicatorProps {
  currentStep: number;
}

const STEPS = [
  { number: 1, label: 'Personal Details' },
  { number: 2, label: 'Membership Details' },
  { number: 3, label: 'Safeguarding & Medical' },
  { number: 4, label: 'Additional Info & Consent' },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-12">
      {/* Labels above the circles */}
      <div className="mb-6 flex justify-between px-0">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-1 justify-center">
            <p
              className={`text-center text-xs font-medium transition-colors ${
                step.number <= currentStep ? 'text-[#2b2b2b]' : 'text-[#969696]'
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>

      {/* Circle-line-circle progression */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center">
            {/* Circle */}
            <div className="flex justify-center flex-shrink-0 w-8">
              <div
                className={`h-8 w-8 rounded-full transition-colors ${
                  step.number < currentStep
                    ? 'bg-[#2b2b2b]'
                    : step.number === currentStep
                    ? 'bg-[#2b2b2b]'
                    : 'border-2 border-[#969696]'
                }`}
              />
            </div>

            {/* Connecting Line (skip after last step) */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-1">
                <div
                  className={`h-1 transition-colors ${
                    step.number < currentStep ? 'bg-[#2b2b2b]' : 'bg-[#e0e0e0]'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
