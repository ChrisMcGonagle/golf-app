'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Step2Data } from '@/components/contexts/FormContext';

interface Step2MembershipProps {
  onValidationChange: (isValid: boolean) => void;
}

export default function Step2Membership({
  onValidationChange,
}: Step2MembershipProps) {
  const { step2, setStep2 } = useFormContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});

  const validateStep = () => {
    const newErrors: Partial<Record<keyof Step2Data, string>> = {};

    // Required fields
    if (!step2.isCruitHome.trim()) newErrors.isCruitHome = 'Please select if Cruit Island is your home club';
    if (!step2.hadOtherClub.trim()) newErrors.hadOtherClub = 'Please select if you are/were a member of another club';
    if (!step2.hasHandicap.trim()) newErrors.hasHandicap = 'Please select if you have a handicap';

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
    return isValid;
  };

  useEffect(() => {
    validateStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step2]);

  const handleChange = (field: keyof Step2Data, value: string) => {
    const newStep2 = { [field]: value };

    // When homeClub changes, prefill previousClubs
    if (field === 'homeClub' && value.trim()) {
      newStep2.previousClubs = value;
    }

    setStep2(newStep2);
  };

  // Conditional field enablement
  const isHomeClubDisabled = step2.isCruitHome === 'Yes';
  const isGhinDisabled = !step2.homeClub.trim() || step2.hadOtherClub === 'No';

  const inputClasses =
    'w-full border-0 border-b-2 border-[#eeeeee] bg-transparent px-0 py-2 text-xs text-[#6f6f6f] placeholder:text-xs placeholder:text-[#969696] focus:border-blue-500 focus:outline-none disabled:border-[#dddddd] disabled:bg-transparent disabled:text-[#8a8a8a] disabled:cursor-not-allowed';
  const selectClasses = `${inputClasses} appearance-none pr-6`;
  const fieldRowClasses = 'grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3';
  const textareaRowClasses = 'grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3';
  const labelClasses = 'text-xs font-bold leading-4 text-[#2b2b2b]';
  const getFieldClasses = (error?: string, baseClasses = inputClasses) =>
    `${baseClasses} ${error ? 'border-red-500 focus:border-red-500' : ''}`;

  return (
    <div className="space-y-6">

      <div className={fieldRowClasses}>
        <label htmlFor="isCruitHome" className={labelClasses}>
          Will Cruit Island Golf Club be your home club? <span className="text-[#ef4444]">*</span>
        </label>
        <div className="relative min-w-0">
          <select
            id="isCruitHome"
            value={step2.isCruitHome}
            onChange={(e) => handleChange('isCruitHome', e.target.value)}
            className={getFieldClasses(errors.isCruitHome, selectClasses)}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 1.5L6 6.5L11 1.5" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className={fieldRowClasses}>
        <label htmlFor="homeClub" className={labelClasses}>
          Home Club {!isHomeClubDisabled && <span className="text-[#ef4444]">*</span>}
        </label>
        <div className="min-w-0">
          <input
            id="homeClub"
            type="text"
            value={step2.homeClub}
            onChange={(e) => handleChange('homeClub', e.target.value)}
            disabled={isHomeClubDisabled}
            className={inputClasses}
            placeholder="Name of your home club"
          />
          {isHomeClubDisabled && (
            <p className="mt-1 text-xs text-gray-500">Disabled because Cruit Island is your home club</p>
          )}
        </div>
      </div>

      <div className={fieldRowClasses}>
        <label htmlFor="hadOtherClub" className={labelClasses}>
          Are you or have you been a member of another club? <span className="text-[#ef4444]">*</span>
        </label>
        <div className="relative min-w-0">
          <select
            id="hadOtherClub"
            value={step2.hadOtherClub}
            onChange={(e) => handleChange('hadOtherClub', e.target.value)}
            className={getFieldClasses(errors.hadOtherClub, selectClasses)}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 1.5L6 6.5L11 1.5" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className={textareaRowClasses}>
        <label htmlFor="previousClubs" className={labelClasses}>
          Previous Clubs
        </label>
        <div className="min-w-0">
          <textarea
            id="previousClubs"
            value={step2.previousClubs}
            onChange={(e) => handleChange('previousClubs', e.target.value)}
            className={`${inputClasses} resize-none`}
            rows={4}
            placeholder="List any previous golf clubs you were a member of"
          />
          <p className="mt-1 text-xs text-gray-500">Pre-filled from Home Club if provided</p>
        </div>
      </div>

      <div className={fieldRowClasses}>
        <label htmlFor="ghinNumber" className={labelClasses}>
          Golf Ireland Number / GHIN
        </label>
        <div className="min-w-0">
          <input
            id="ghinNumber"
            type="text"
            value={step2.ghinNumber}
            onChange={(e) => handleChange('ghinNumber', e.target.value)}
            disabled={isGhinDisabled}
            className={inputClasses}
            placeholder="Your GHIN number"
          />
          {isGhinDisabled && (
            <p className="mt-1 text-xs text-gray-500">
              Disabled because {!step2.homeClub.trim() ? 'home club is not provided' : 'you have not been a member of another club'}
            </p>
          )}
        </div>
      </div>

      <div className={fieldRowClasses}>
        <label htmlFor="hasHandicap" className={labelClasses}>
          Do you have a current handicap index or ever had one? <span className="text-[#ef4444]">*</span>
        </label>
        <div className="relative min-w-0">
          <select
            id="hasHandicap"
            value={step2.hasHandicap}
            onChange={(e) => handleChange('hasHandicap', e.target.value)}
            className={getFieldClasses(errors.hasHandicap, selectClasses)}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 1.5L6 6.5L11 1.5" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className={fieldRowClasses}>
        <label htmlFor="handicapIndex" className={labelClasses}>
          Handicap Index
        </label>
        <div className="min-w-0">
          <input
            id="handicapIndex"
            type="text"
            value={step2.handicapIndex}
            onChange={(e) => handleChange('handicapIndex', e.target.value)}
            className={inputClasses}
            placeholder="Your current handicap index"
          />
        </div>
      </div>
    </div>
  );
}
