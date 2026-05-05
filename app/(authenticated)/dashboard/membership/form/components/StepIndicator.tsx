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

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-12">
      {/* Grid layout: 7 columns (4 steps + 3 lines, all equal width) */}
      <div className="grid grid-cols-7 gap-0">
        {/* Row 1: Text labels in step columns (0, 2, 4, 6) */}
        <div className="col-span-1 flex justify-center">
          <p
            className={`mb-3 text-center text-xs font-bold uppercase transition-colors ${
              STEPS[0].number <= currentStep ? 'text-[#2b2b2b]' : 'text-[#969696]'
            }`}
          >
            {STEPS[0].label}
          </p>
        </div>
        <div className="col-span-1" /> {/* Line column spacer */}
        <div className="col-span-1 flex justify-center">
          <p
            className={`mb-3 text-center text-xs font-bold uppercase transition-colors ${
              STEPS[1].number <= currentStep ? 'text-[#2b2b2b]' : 'text-[#969696]'
            }`}
          >
            {STEPS[1].label}
          </p>
        </div>
        <div className="col-span-1" /> {/* Line column spacer */}
        <div className="col-span-1 flex justify-center">
          <p
            className={`mb-3 text-center text-xs font-bold uppercase transition-colors ${
              STEPS[2].number <= currentStep ? 'text-[#2b2b2b]' : 'text-[#969696]'
            }`}
          >
            {STEPS[2].label}
          </p>
        </div>
        <div className="col-span-1" /> {/* Line column spacer */}
        <div className="col-span-1 flex justify-center">
          <p
            className={`mb-3 text-center text-xs font-bold uppercase transition-colors ${
              STEPS[3].number <= currentStep ? 'text-[#2b2b2b]' : 'text-[#969696]'
            }`}
          >
            {STEPS[3].label}
          </p>
        </div>

        {/* Row 2: Circles in step columns, lines in line columns */}
        <div className="col-span-1 flex justify-center">
          <div
            className={`h-6 w-6 rounded-full transition-colors ${
              STEPS[0].number < currentStep
                ? 'bg-[#2b2b2b]'
                : STEPS[0].number === currentStep
                ? 'bg-[#2b2b2b]'
                : 'bg-[#e0e0e0]'
            }`}
          />
        </div>
        <div className="col-span-1 flex items-center">
          <div
            className={`h-[0.4rem] w-full transition-colors ${
              STEPS[0].number < currentStep ? 'bg-[#2b2b2b]' : 'bg-[#e0e0e0]'
            }`}
          />
        </div>
        <div className="col-span-1 flex justify-center">
          <div
            className={`h-6 w-6 rounded-full transition-colors ${
              STEPS[1].number < currentStep
                ? 'bg-[#2b2b2b]'
                : STEPS[1].number === currentStep
                ? 'bg-[#2b2b2b]'
                : 'bg-[#e0e0e0]'
            }`}
          />
        </div>
        <div className="col-span-1 flex items-center">
          <div
            className={`h-[0.4rem] w-full transition-colors ${
              STEPS[1].number < currentStep ? 'bg-[#2b2b2b]' : 'bg-[#e0e0e0]'
            }`}
          />
        </div>
        <div className="col-span-1 flex justify-center">
          <div
            className={`h-6 w-6 rounded-full transition-colors ${
              STEPS[2].number < currentStep
                ? 'bg-[#2b2b2b]'
                : STEPS[2].number === currentStep
                ? 'bg-[#2b2b2b]'
                : 'bg-[#e0e0e0]'
            }`}
          />
        </div>
        <div className="col-span-1 flex items-center">
          <div
            className={`h-[0.4rem] w-full transition-colors ${
              STEPS[2].number < currentStep ? 'bg-[#2b2b2b]' : 'bg-[#e0e0e0]'
            }`}
          />
        </div>
        <div className="col-span-1 flex justify-center">
          <div
            className={`h-6 w-6 rounded-full transition-colors ${
              STEPS[3].number < currentStep
                ? 'bg-[#2b2b2b]'
                : STEPS[3].number === currentStep
                ? 'bg-[#2b2b2b]'
                : 'bg-[#e0e0e0]'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
