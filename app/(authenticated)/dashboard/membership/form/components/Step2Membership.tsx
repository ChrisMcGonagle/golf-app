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
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed';
  const selectClasses = inputClasses;
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Membership Details</h3>

      <div>
        <label htmlFor="isCruitHome" className={labelClasses}>
          Will Cruit Island Golf Club be your home club? *
        </label>
        <select
          id="isCruitHome"
          value={step2.isCruitHome}
          onChange={(e) => handleChange('isCruitHome', e.target.value)}
          className={selectClasses}
        >
          <option value="">Select...</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        {errors.isCruitHome && (
          <p className="mt-1 text-sm text-red-600">{errors.isCruitHome}</p>
        )}
      </div>

      <div>
        <label htmlFor="homeClub" className={labelClasses}>
          Home Club {!isHomeClubDisabled && '*'}
        </label>
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

      <div>
        <label htmlFor="hadOtherClub" className={labelClasses}>
          Are you or have you been a member of another club? *
        </label>
        <select
          id="hadOtherClub"
          value={step2.hadOtherClub}
          onChange={(e) => handleChange('hadOtherClub', e.target.value)}
          className={selectClasses}
        >
          <option value="">Select...</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        {errors.hadOtherClub && (
          <p className="mt-1 text-sm text-red-600">{errors.hadOtherClub}</p>
        )}
      </div>

      <div>
        <label htmlFor="previousClubs" className={labelClasses}>
          Previous Clubs
        </label>
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

      <div>
        <label htmlFor="ghinNumber" className={labelClasses}>
          Golf Ireland Number / GHIN
        </label>
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

      <div>
        <label htmlFor="hasHandicap" className={labelClasses}>
          Do you have a current handicap index or ever had one? *
        </label>
        <select
          id="hasHandicap"
          value={step2.hasHandicap}
          onChange={(e) => handleChange('hasHandicap', e.target.value)}
          className={selectClasses}
        >
          <option value="">Select...</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        {errors.hasHandicap && (
          <p className="mt-1 text-sm text-red-600">{errors.hasHandicap}</p>
        )}
      </div>

      <div>
        <label htmlFor="handicapIndex" className={labelClasses}>
          Handicap Index
        </label>
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
  );
}
