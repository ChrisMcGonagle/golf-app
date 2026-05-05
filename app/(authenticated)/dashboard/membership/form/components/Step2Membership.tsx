'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Step2Data } from '@/components/contexts/FormContext';

interface Step2MembershipProps {
  onValidationChange: (isValid: boolean) => void;
}

interface PreviousClub {
  name: string;
  country: string;
}

// Simplified country list
const COUNTRIES = ['Ireland', 'England', 'Wales', 'Scotland', 'Other'];

// Required fields in order (excluding conditional fields)
const REQUIRED_FIELDS_ORDER: (keyof Step2Data)[] = [
  'isCurrentMember',
  'ghinNumber',
  'homeClub',
  'homeClubCountry',
  'isCruitHome',
  'hadOtherClub',
  'hasHandicap',
];

export default function Step2Membership({
  onValidationChange,
}: Step2MembershipProps) {
  const { step2, setStep2 } = useFormContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});
  const [blurredFields, setBlurredFields] = useState<Partial<Record<keyof Step2Data, boolean>>>({});
  const [previousClubsInput, setPreviousClubsInput] = useState('');
  const [previousClubsCountry, setPreviousClubsCountry] = useState('');
  const [previousClubsList, setPreviousClubsList] = useState<PreviousClub[]>([]);

  // Conditional field enablement
  const isGhinDisabled = step2.isCurrentMember !== 'Yes';
  const isGhinStruckOut = step2.isCurrentMember === 'No';
  const isHomeClubRequired = step2.isCurrentMember === 'Yes';
  const isHomeClubStruckOut = step2.isCurrentMember === 'No';
  const isCruitLocked = step2.isCurrentMember === 'No';
  const isHadOtherClubLocked = step2.isCurrentMember === 'Yes';
  const isHadOtherClubStruckOut = step2.isCurrentMember === 'Yes';
  const isHandicapStruckOut = step2.hadOtherClub === 'No';
  const isPreviousClubsStruckOut = step2.hadOtherClub === 'No';
  const isPreviousClubsRequired = step2.hadOtherClub === 'Yes' && step2.isCurrentMember === 'No';
  const isHandicapIndexRequired = step2.hasHandicap === 'Yes';
  const isHandicapIndexStruckOut = step2.hasHandicap === 'No';
  const showHomeClubOtherInfo = step2.homeClubCountry === 'Other';

  // Initialize previousClubsList from previousClubs context
  useEffect(() => {
    try {
      const parsed = step2.previousClubs.trim() ? JSON.parse(step2.previousClubs) : [];
      if (Array.isArray(parsed)) {
        // Handle both old string format and new object format for backwards compatibility
        const normalized = parsed.map((item): PreviousClub => {
          if (typeof item === 'string') {
            return { name: item, country: '' };
          }
          return item;
        });
        setPreviousClubsList(normalized);
      }
    } catch {
      setPreviousClubsList([]);
    }
  }, [step2.previousClubs]);

  // Find the first empty required field in order (excluding conditional fields that are disabled)
  const getFirstEmptyRequiredField = (): keyof Step2Data | null => {
    for (const field of REQUIRED_FIELDS_ORDER) {
      // Skip ghinNumber if isCurrentMember is not "Yes"
      if (field === 'ghinNumber' && step2.isCurrentMember !== 'Yes') {
        continue;
      }
      // Skip homeClub if it's not required
      if (field === 'homeClub' && !isHomeClubRequired) {
        continue;
      }
      // Skip homeClubCountry when homeClub is not filled
      if (field === 'homeClubCountry' && !step2.homeClub.trim()) {
        continue;
      }
      if (!step2[field].trim()) {
        return field;
      }
    }
    // Check handicapIndex if hasHandicap is "Yes"
    if (isHandicapIndexRequired && !step2.handicapIndex.trim()) {
      return 'handicapIndex';
    }
    return null;
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof Step2Data, string>> = {};
    const firstEmpty = getFirstEmptyRequiredField();

    // Only mark the first empty required field as required error
    if (firstEmpty) {
      if (firstEmpty === 'isCurrentMember')
        newErrors.isCurrentMember = 'Please select if they are a current member of a club';
      if (firstEmpty === 'ghinNumber')
        newErrors.ghinNumber = 'Golf Ireland Number / GHIN is required when they are a current member';
      if (firstEmpty === 'isCruitHome')
        newErrors.isCruitHome = 'Please select if Cruit Island is your home club';
      if (firstEmpty === 'hadOtherClub')
        newErrors.hadOtherClub = 'Please select if you are/were a member of another club';
      if (firstEmpty === 'hasHandicap')
        newErrors.hasHandicap = 'Please select if you have a handicap';
      if (firstEmpty === 'homeClub') newErrors.homeClub = 'Home club is required when they are a current member';
      if (firstEmpty === 'homeClubCountry') newErrors.homeClubCountry = 'Please select a country for your home club';
      if (firstEmpty === 'handicapIndex') newErrors.handicapIndex = 'Handicap index is required';
    }

    // Validate previousClubs when required
    if (isPreviousClubsRequired && previousClubsList.length === 0) {
      newErrors.previousClubs = 'At least one previous club is required';
    }

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
    const updates: Partial<Step2Data> = { [field]: value };
    
    // Auto-select logic: if Cruit Island is NOT home club, they must have been a member elsewhere
    if (field === 'isCruitHome' && value === 'No') {
      updates.hadOtherClub = 'Yes';
    }

    // When hadOtherClub changes to No, reset handicap fields and previous clubs
    if (field === 'hadOtherClub' && value === 'No') {
      updates.hasHandicap = '';
      updates.handicapIndex = '';
      updates.previousClubs = '[]';
      setPreviousClubsList([]);
    }

    // When hasHandicap changes to No, reset handicapIndex
    if (field === 'hasHandicap' && value === 'No') {
      updates.handicapIndex = '';
    }

    // When isCurrentMember changes, auto-set isCruitHome and hadOtherClub accordingly
    if (field === 'isCurrentMember' && value === 'No') {
      updates.isCruitHome = 'Yes';
      updates.hadOtherClub = '';
    }
    if (field === 'isCurrentMember' && value === 'Yes') {
      updates.isCruitHome = '';
      updates.hadOtherClub = 'Yes';
    }
    
    setStep2(updates);
  };

  const handleFieldBlur = (field: keyof Step2Data) => {
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleAddClub = () => {
    const clubName = previousClubsInput.trim();
    if (!clubName || !previousClubsCountry) return;
    if (previousClubsList.some((club) => club.name === clubName)) return;
    if (previousClubsList.length >= 5) return;

    const newClub: PreviousClub = { name: clubName, country: previousClubsCountry };
    const newList = [...previousClubsList, newClub];
    setPreviousClubsList(newList);
    setStep2({ previousClubs: JSON.stringify(newList) });
    setPreviousClubsInput('');
    setPreviousClubsCountry('');
  };

  const handleRemoveClub = (index: number) => {
    const newList = previousClubsList.filter((_, i) => i !== index);
    setPreviousClubsList(newList);
    setStep2({ previousClubs: JSON.stringify(newList) });
  };

  // Conditional field enablement (already defined above after firstEmptyRequired state)

  const inputClasses =
    'w-full border-0 border-b-2 border-[#eeeeee] bg-transparent px-0 py-2 text-xs text-[#6f6f6f] placeholder:text-xs placeholder:text-[#969696] focus:border-[#d4d4d4] focus:outline-none disabled:border-[#dddddd] disabled:bg-transparent disabled:text-[#8a8a8a] disabled:cursor-not-allowed';
  const selectClasses = `${inputClasses} appearance-none pr-6`;
  const fieldRowClasses = 'grid grid-cols-[28rem_minmax(0,1fr)] items-center gap-3';
  const labelClasses = 'text-xs font-bold leading-4 text-[#2b2b2b]';
  const getFieldClasses = (
    field: keyof Step2Data,
    value: string,
    error?: string,
    baseClasses = inputClasses,
    allowFilled = true
  ) => {
    // Show red if there's an error (format error or first empty required field)
    if (error) {
      return `${baseClasses} border-red-500 focus:border-red-500`;
    }

    // Show green if field has been blurred and has a value (and is not disabled)
    if (allowFilled && blurredFields[field] && value.trim()) {
      return `${baseClasses} border-[#22c55e] focus:border-[#d4d4d4]`;
    }

    return baseClasses;
  };

  return (
    <div className="space-y-6">

      {/* 1. Are they a current member of a club? */}
      <div className={fieldRowClasses}>
        <label htmlFor="isCurrentMember" className={labelClasses}>
          Are you a member of a club currently? <span className="text-[#ef4444]">*</span>
        </label>
        <div className="relative min-w-0">
          <select
            id="isCurrentMember"
            value={step2.isCurrentMember}
            onChange={(e) => handleChange('isCurrentMember', e.target.value)}
            onBlur={() => handleFieldBlur('isCurrentMember')}
            autoComplete="off"
            className={getFieldClasses('isCurrentMember', step2.isCurrentMember, errors.isCurrentMember, selectClasses)}
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

      {/* 2. GHIN Number — conditional on isCurrentMember */}
      <div className={fieldRowClasses}>
        <label htmlFor="ghinNumber" className={`${labelClasses} ${isGhinStruckOut ? 'line-through text-[#969696]' : ''}`}>
          Golf Ireland Number / Golf Union Number {step2.isCurrentMember === 'Yes' && <span className="text-[#ef4444]">*</span>}
        </label>
        <div className="min-w-0">
          <input
            id="ghinNumber"
            type="text"
            value={step2.ghinNumber}
            onChange={(e) => handleChange('ghinNumber', e.target.value)}
            onBlur={() => handleFieldBlur('ghinNumber')}
            disabled={isGhinDisabled}
            autoComplete="off"
            className={`${getFieldClasses('ghinNumber', step2.ghinNumber, errors.ghinNumber, inputClasses, !isGhinDisabled)} ${isGhinStruckOut ? 'line-through placeholder:line-through placeholder:text-[#cccccc]' : ''}`}
            placeholder="Your GHIN number"
          />
        </div>
      </div>

      {/* 3. Home Club (with country picker) */}
      <div className={fieldRowClasses}>
        <label htmlFor="homeClub" className={`${labelClasses} ${isHomeClubStruckOut ? 'line-through text-[#969696]' : ''}`}>
          Home Club {isHomeClubRequired && !isHomeClubStruckOut && <span className="text-[#ef4444]">*</span>}
        </label>
        <div className="min-w-0 space-y-2">
          <input
            id="homeClub"
            type="text"
            value={step2.homeClub}
            onChange={(e) => handleChange('homeClub', e.target.value)}
            onBlur={() => handleFieldBlur('homeClub')}
            disabled={isHomeClubStruckOut}
            autoComplete="off"
            className={`${getFieldClasses('homeClub', step2.homeClub, errors.homeClub, inputClasses)} ${isHomeClubStruckOut ? 'placeholder:line-through placeholder:text-[#cccccc]' : ''}`}
            placeholder="Name of your home club"
          />
          <div className="relative min-w-0">
              <select
                id="homeClubCountry"
                value={step2.homeClubCountry}
                onChange={(e) => handleChange('homeClubCountry', e.target.value)}
                onBlur={() => handleFieldBlur('homeClubCountry')}
                disabled={isHomeClubStruckOut}
                autoComplete="off"
                className={`${getFieldClasses('homeClubCountry', step2.homeClubCountry, errors.homeClubCountry, selectClasses)} ${isHomeClubStruckOut ? 'line-through text-[#cccccc]' : ''}`}
              >
                <option value="">Select country...</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
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
      </div>

      {/* 4. Do you want Cruit Island to be your home club? */}
      <div className={fieldRowClasses}>
        <label htmlFor="isCruitHome" className={labelClasses}>
          Will Cruit Island Golf Club be your home club? <span className="text-[#ef4444]">*</span>
        </label>
        <div className="relative min-w-0">
          <select
            id="isCruitHome"
            value={step2.isCruitHome}
            onChange={(e) => handleChange('isCruitHome', e.target.value)}
            onBlur={() => handleFieldBlur('isCruitHome')}
            disabled={isCruitLocked}
            autoComplete="off"
            className={getFieldClasses('isCruitHome', step2.isCruitHome, errors.isCruitHome, selectClasses)}
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

      {/* 5. Have you been a member of another club? */}
      <div className={fieldRowClasses}>
        <label htmlFor="hadOtherClub" className={`${labelClasses} ${isHadOtherClubStruckOut ? 'line-through text-[#969696]' : ''}`}>
          Have you been a member of another club previosuly? {!isHadOtherClubStruckOut && <span className="text-[#ef4444]">*</span>}
        </label>
        <div className="relative min-w-0">
          <select
            id="hadOtherClub"
            value={step2.hadOtherClub}
            onChange={(e) => handleChange('hadOtherClub', e.target.value)}
            onBlur={() => handleFieldBlur('hadOtherClub')}
            disabled={isHadOtherClubLocked}
            autoComplete="off"
            className={`${getFieldClasses('hadOtherClub', step2.hadOtherClub, errors.hadOtherClub, selectClasses)} ${isHadOtherClubStruckOut ? 'line-through' : ''}`}
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

      {/* 6. Do you have a handicap index or ever had one? + Handicap Index inline */}
      <div className="flex items-center gap-3">
        <label htmlFor="hasHandicap" className={`w-[28rem] shrink-0 whitespace-nowrap ${labelClasses} ${isHandicapStruckOut ? 'line-through text-[#969696]' : ''}`}>
          {step2.isCurrentMember === 'Yes' ? 'Do you currently have a handicap index?' : 'Have you ever had a handicap?'} {!isHandicapStruckOut && <span className="text-[#ef4444]">*</span>}
        </label>
        <div className="relative w-40">
          <select
            id="hasHandicap"
            value={step2.hasHandicap}
            onChange={(e) => handleChange('hasHandicap', e.target.value)}
            onBlur={() => handleFieldBlur('hasHandicap')}
            disabled={isHandicapStruckOut}
            autoComplete="off"
            className={`w-40 ${getFieldClasses('hasHandicap', step2.hasHandicap, errors.hasHandicap, selectClasses)} ${isHandicapStruckOut ? 'line-through' : ''}`}
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
        <label htmlFor="handicapIndex" className={`${labelClasses} ${isHandicapIndexStruckOut ? 'line-through text-[#969696]' : ''}`}>
          Handicap Index
        </label>
        <input
          id="handicapIndex"
          type="text"
          value={step2.handicapIndex}
          onChange={(e) => handleChange('handicapIndex', e.target.value)}
          onBlur={() => handleFieldBlur('handicapIndex')}
          disabled={isHandicapIndexStruckOut}
          maxLength={4}
          autoComplete="off"
          className={`w-16 lg:w-full ${getFieldClasses('handicapIndex', step2.handicapIndex, errors.handicapIndex, inputClasses, !isHandicapIndexStruckOut)} ${isHandicapIndexStruckOut ? 'line-through placeholder:line-through placeholder:text-[#cccccc]' : ''}`}
          placeholder="HCP"
        />
      </div>

      {/* 8. Additional/Previous Clubs */}
      <div className="grid grid-cols-[28rem_minmax(0,1fr)] items-start gap-3">
        <label htmlFor="previousClubs" className={`${labelClasses} ${isPreviousClubsStruckOut ? 'line-through text-[#969696]' : ''}`}>
          Additional/Previous Clubs {isPreviousClubsRequired && !isPreviousClubsStruckOut && <span className="text-[#ef4444]">*</span>}
        </label>
        <div className="min-w-0 space-y-3">
          <div className="flex gap-2 items-center">
            <div className="flex-1 space-y-2">
              <input
                id="previousClubs"
                type="text"
                value={previousClubsInput}
                onChange={(e) => setPreviousClubsInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddClub()}
                autoComplete="off"
                className={`${inputClasses} ${isPreviousClubsStruckOut ? 'line-through placeholder:line-through placeholder:text-[#cccccc]' : ''}`}
                placeholder="Enter club name"
                disabled={previousClubsList.length >= 5 || isPreviousClubsStruckOut}
              />
              <div className="relative min-w-0">
                <select
                  id="previousClubsCountry"
                  value={previousClubsCountry}
                  onChange={(e) => setPreviousClubsCountry(e.target.value)}
                  autoComplete="off"
                  className={`${selectClasses} w-full border-0 border-b-2 border-[#eeeeee] bg-transparent px-0 py-2 text-xs text-[#6f6f6f] ${isPreviousClubsStruckOut ? 'line-through' : ''}`}
                  disabled={previousClubsList.length >= 5 || isPreviousClubsStruckOut}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
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
            <button
              type="button"
              onClick={handleAddClub}
              disabled={previousClubsList.length >= 5 || !previousClubsInput.trim() || !previousClubsCountry || isPreviousClubsStruckOut}
              className="whitespace-nowrap rounded bg-[#2b2b2b] px-3 py-2 text-xs font-medium text-white hover:bg-[#1a1a1a] disabled:bg-[#d0d0d0] disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          <div className={`min-h-[6rem] flex flex-wrap gap-2 items-start content-start border-b border-[#eeeeee] bg-transparent p-2 ${isPreviousClubsStruckOut ? 'opacity-50' : ''}`}>
            {previousClubsList.map((club, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 bg-[#f5f6f5] border border-[#eeeeee] rounded text-xs text-[#2b2b2b] px-3 py-2"
              >
                <span>
                  {club.name}
                  {club.country && `, ${club.country}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveClub(index)}
                  className="text-[#969696] hover:text-[#ef4444] cursor-pointer font-semibold"
                  aria-label={`Remove ${club.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {previousClubsList.length > 0 && (
            <p className="text-xs text-[#969696]">
              {previousClubsList.length}/5 clubs added
            </p>
          )}
          {errors.previousClubs && (
            <p className="text-xs text-red-500">{errors.previousClubs}</p>
          )}
        </div>
      </div>

      <div className="flex justify-center w-full mt-3">
        <div className="min-h-[1.25rem] w-full max-w-2xl space-y-3">
          {showHomeClubOtherInfo && (
            <div className="bg-[#fef3c7] border border-[#fcd34d] rounded p-3 text-[#92400e] text-xs leading-relaxed mx-auto w-full max-w-2xl">
              Note: Additional verification may be required for clubs outside the UK & Ireland.
              <br />
              <br />
              To align your handicap, please provide a screenshot of your most recent scores (up to your last 20), including: course name, tees played, course rating, slope rating, score, and date.
              <br />
              <br />
              Any rounds used for handicapping with your other union must also be added to your record here (and vice versa) to keep both handicaps in sync. If you do not wish to maintain both, you can choose to proceed with a Golf Ireland membership without a handicap index by selecting the checkbox below.
              <div className="mt-3 flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  id="noHandicapSyncWanted"
                  checked={step2.noHandicapSyncWanted === 'true'}
                  onChange={(e) => handleChange('noHandicapSyncWanted', e.target.checked ? 'true' : 'false')}
                  className="cursor-pointer"
                />
                <label htmlFor="noHandicapSyncWanted" className="text-xs text-[#6f6f6f] cursor-pointer">
                  I do not wish to maintain a handicap across unions
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
