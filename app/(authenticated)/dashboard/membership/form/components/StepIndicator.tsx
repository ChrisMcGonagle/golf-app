'use client';

interface StepIndicatorProps {
  currentStep: number;
  completing?: boolean;
}

const STEPS = [
  { number: 1, label: 'Personal' },
  { number: 2, label: 'Membership' },
  { number: 3, label: 'Safeguarding' },
  { number: 4, label: 'Consent' },
];

const getCircleColor = (stepNumber: number, currentStep: number, completing: boolean): string => {
  if (completing) return 'bg-[#22c55e]';
  if (stepNumber < currentStep) {
    return 'bg-[#22c55e]';
  }
  if (stepNumber === currentStep) {
    return 'border-[0.3rem] border-[#fbbf24] bg-transparent';
  }
  return 'bg-[#e0e0e0]';
};

const getLineColor = (stepNumber: number, currentStep: number, completing: boolean): string => {
  if (completing) return 'bg-[#22c55e]';
  if (stepNumber === currentStep - 1) {
    return 'bg-gradient-to-r from-[#22c55e] to-[#fbbf24]';
  }
  if (stepNumber < currentStep - 1) {
    return 'bg-[#22c55e]';
  }
  if (stepNumber === currentStep) {
    return 'bg-gradient-to-r from-[#fbbf24] to-[#e0e0e0]';
  }
  return 'bg-[#e0e0e0]';
};

export default function StepIndicator({ currentStep, completing = false }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-end mx-auto max-w-[35rem]">
        {STEPS.flatMap((step, index) => {
          const items: JSX.Element[] = [
            <div key={`label-${step.number}`} className="flex w-6 justify-center">
              <p
                className={`text-center text-xs font-bold uppercase transition-colors duration-500 ${
                  completing ? 'text-[#22c55e]' : step.number === currentStep ? 'text-[#fbbf24]' : step.number < currentStep ? 'text-[#22c55e]' : 'text-[#969696]'
                }`}
              >
                {step.label}
              </p>
            </div>,
          ];

          if (index < STEPS.length - 1) {
            items.push(
              <div key={`label-space-${step.number}`} className="flex-1" />,
            );
          }

          return items;
        })}
      </div>

      <div className="flex items-center mx-auto max-w-[35rem]">
        {STEPS.flatMap((step, index) => {
          const items: JSX.Element[] = [
            <div
              key={`circle-${step.number}`}
              className={`h-6 w-6 rounded-full transition-colors duration-500 flex-shrink-0 flex-grow-0 ${getCircleColor(
                step.number,
                currentStep,
                completing,
              )}`}
            />,
          ];

          if (index < STEPS.length - 1) {
            items.push(
              <div
                key={`line-after-${step.number}`}
                className={`h-[0.4rem] flex-grow transition-colors duration-500 ${getLineColor(
                  step.number,
                  currentStep,
                  completing,
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
