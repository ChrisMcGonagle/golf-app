'use client';

interface StepIndicatorProps {
  currentStep: number;
}

const STEPS = [
  { number: 1, label: 'Personal' },
  { number: 2, label: 'Membership' },
  { number: 3, label: 'Safeguarding' },
  { number: 4, label: 'Consent' },
];

const getCircleColor = (stepNumber: number, currentStep: number): string => {
  if (stepNumber < currentStep) {
    return 'bg-[#2b2b2b]';
  }
  if (stepNumber === currentStep) {
    return 'bg-[#2b2b2b]';
  }
  return 'bg-[#e0e0e0]';
};

const getLineColor = (stepNumber: number, currentStep: number): string => {
  if (stepNumber < currentStep) {
    return 'bg-[#2b2b2b]';
  }
  return 'bg-[#e0e0e0]';
};

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      {/* Row 1: Labels aligned above circles using grid */}
      <div className="mb-3 grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] gap-0 mx-auto max-w-[35rem]">
        {STEPS.flatMap((step, index) => {
          const items: JSX.Element[] = [
            // Label container
            <div 
              key={`label-${step.number}`} 
              className={`col-span-1 flex justify-center ${step.number === 1 || step.number === 4 ? 'w-6' : ''}`}
            >
              <p
                className={`text-center text-xs font-bold uppercase transition-colors ${
                  step.number <= currentStep ? 'text-[#2b2b2b]' : 'text-[#969696]'
                }`}
              >
                {step.label}
              </p>
            </div>,
          ];

          // Empty div for line column (only if not the last label)
          if (index < STEPS.length - 1) {
            items.push(
              <div key={`label-space-${step.number}`} />,
            );
          }

          return items;
        })}
      </div>

      {/* Row 2: Alternating circles and lines */}
      <div className="flex items-center mx-auto max-w-[35rem]">
        {STEPS.flatMap((step, index) => {
          const items: JSX.Element[] = [
            // Circle
            <div
              key={`circle-${step.number}`}
              className={`h-6 w-6 rounded-full transition-colors flex-shrink-0 flex-grow-0 ${getCircleColor(
                step.number,
                currentStep,
              )}`}
            />,
          ];

          // Line after circle (only if not the last circle)
          if (index < STEPS.length - 1) {
            items.push(
              <div
                key={`line-after-${step.number}`}
                className={`h-[0.4rem] flex-grow transition-colors ${getLineColor(
                  step.number,
                  currentStep,
                )}`}
              />,
            );
          }

          return items;
        })}
      </div>
    </div>
  );
}
