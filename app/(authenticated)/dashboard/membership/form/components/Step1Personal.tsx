'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Step1Data } from '@/components/contexts/FormContext';

interface Step1PersonalProps {
  onValidationChange: (isValid: boolean) => void;
}

const REQUIRED_FIELDS_ORDER: (keyof Step1Data)[] = [
  'firstName',
  'surname',
  'dob',
  'gender',
  'address1',
  'city',
  'county',
  'postalCode',
  'country',
  'email',
  'phone',
];

export default function Step1Personal({
  onValidationChange,
}: Step1PersonalProps) {
  const { step1, setStep1 } = useFormContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [blurredFields, setBlurredFields] = useState<Partial<Record<keyof Step1Data, boolean>>>({});

  // Find the first empty required field in order
  const getFirstEmptyRequiredField = (): keyof Step1Data | null => {
    for (const field of REQUIRED_FIELDS_ORDER) {
      if (!step1[field].trim()) {
        return field;
      }
    }
    return null;
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof Step1Data, string>> = {};
    const firstEmpty = getFirstEmptyRequiredField();

    // Only mark the first empty required field as required error
    if (firstEmpty) {
      if (firstEmpty === 'firstName') newErrors.firstName = 'First name is required';
      if (firstEmpty === 'surname') newErrors.surname = 'Surname is required';
      if (firstEmpty === 'dob') newErrors.dob = 'Date of birth is required';
      if (firstEmpty === 'gender') newErrors.gender = 'Gender is required';
      if (firstEmpty === 'address1') newErrors.address1 = 'Address line 1 is required';
      if (firstEmpty === 'city') newErrors.city = 'City is required';
      if (firstEmpty === 'county') newErrors.county = 'County is required';
      if (firstEmpty === 'postalCode') newErrors.postalCode = 'Postal code is required';
      if (firstEmpty === 'country') newErrors.country = 'Country is required';
      if (firstEmpty === 'email') newErrors.email = 'Email is required';
      if (firstEmpty === 'phone') newErrors.phone = 'Phone number is required';
    }

    // Email validation (format error)
    if (step1.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Date validation (format error)
    if (step1.dob.trim()) {
      const date = new Date(step1.dob);
      if (isNaN(date.getTime())) {
        newErrors.dob = 'Invalid date format';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
    return isValid;
  };

  useEffect(() => {
    validateStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1]);

  const handleChange = (
    field: keyof Step1Data,
    value: string
  ) => {
    setStep1({ [field]: value });
  };

  const handleFieldBlur = (field: keyof Step1Data) => {
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  const inputClasses =
    'w-full border-0 border-b-2 border-[#eeeeee] bg-transparent px-0 py-2 text-xs text-[#6f6f6f] placeholder:text-xs placeholder:text-[#969696] focus:border-[#d4d4d4] focus:outline-none';
  const selectClasses = `${inputClasses} appearance-none rounded-none pt-[7px] pb-[9px] pr-6 leading-normal`;
  const fieldRowClasses = 'grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3';
  const labelClasses = 'text-xs font-bold leading-4 text-[#2b2b2b]';
  const getFieldClasses = (
    field: keyof Step1Data,
    value: string,
    error?: string,
    baseClasses = inputClasses
  ) => {
    // Show red if there's an error (format error or first empty required field)
    if (error) {
      return `${baseClasses} border-red-500 focus:border-red-500`;
    }

    // Show green if field has been blurred and has a value
    if (blurredFields[field] && value.trim()) {
      return `${baseClasses} border-[#22c55e] focus:border-[#d4d4d4]`;
    }

    return baseClasses;
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Basic Information */}
      <section>
        <h3 className="mb-3 inline-block border-b border-[#eeeeee] text-xs font-semibold text-[#2b2b2b]">
          Basic Information :
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className={fieldRowClasses}>
            <label htmlFor="firstName" className={labelClasses}>
              First Name <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="firstName"
                type="text"
                value={step1.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                onBlur={() => handleFieldBlur('firstName')}
                autoComplete="off"
                className={getFieldClasses('firstName', step1.firstName, errors.firstName)}
                placeholder="John"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="surname" className={labelClasses}>
              Surname <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="surname"
                type="text"
                value={step1.surname}
                onChange={(e) => handleChange('surname', e.target.value)}
                onBlur={() => handleFieldBlur('surname')}
                autoComplete="off"
                className={getFieldClasses('surname', step1.surname, errors.surname)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="dob" className={labelClasses}>
              Date of Birth <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="dob"
                type="date"
                value={step1.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                onBlur={() => handleFieldBlur('dob')}
                autoComplete="off"
                className={getFieldClasses('dob', step1.dob, errors.dob)}
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="gender" className={labelClasses}>
              Gender <span className="text-[#ef4444]">*</span>
            </label>
            <div className="relative min-w-0">
              <select
                id="gender"
                value={step1.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                onBlur={() => handleFieldBlur('gender')}
                autoComplete="off"
                className={getFieldClasses('gender', step1.gender, errors.gender, selectClasses)}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
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
      </section>

      {/* Section 2: Contact Information */}
      <section>
        <h3 className="mb-3 inline-block border-b border-[#eeeeee] text-xs font-semibold text-[#2b2b2b]">
          Contact Information :
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className={fieldRowClasses}>
            <label htmlFor="address1" className={labelClasses}>
              Address Line 1 <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="address1"
                type="text"
                value={step1.address1}
                onChange={(e) => handleChange('address1', e.target.value)}
                onBlur={() => handleFieldBlur('address1')}
                autoComplete="off"
                className={getFieldClasses('address1', step1.address1, errors.address1)}
                placeholder="123 Main Street"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="address2" className={labelClasses}>
              Address Line 2
            </label>
            <div className="min-w-0">
              <input
                id="address2"
                type="text"
                value={step1.address2}
                onChange={(e) => handleChange('address2', e.target.value)}
                onBlur={() => handleFieldBlur('address2')}
                autoComplete="off"
                className={getFieldClasses('address2', step1.address2)}
                placeholder="Apartment 4B"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="city" className={labelClasses}>
              City <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="city"
                type="text"
                value={step1.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleFieldBlur('city')}
                autoComplete="off"
                className={getFieldClasses('city', step1.city, errors.city)}
                placeholder="Dublin"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="county" className={labelClasses}>
              County <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="county"
                type="text"
                value={step1.county}
                onChange={(e) => handleChange('county', e.target.value)}
                onBlur={() => handleFieldBlur('county')}
                autoComplete="off"
                className={getFieldClasses('county', step1.county, errors.county)}
                placeholder="Dublin"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="postalCode" className={labelClasses}>
              Postal Code <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="postalCode"
                type="text"
                value={step1.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                onBlur={() => handleFieldBlur('postalCode')}
                autoComplete="off"
                className={getFieldClasses('postalCode', step1.postalCode, errors.postalCode)}
                placeholder="D01 1AA"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="country" className={labelClasses}>
              Country <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="country"
                type="text"
                value={step1.country}
                onChange={(e) => handleChange('country', e.target.value)}
                onBlur={() => handleFieldBlur('country')}
                autoComplete="off"
                className={getFieldClasses('country', step1.country, errors.country)}
                placeholder="Ireland"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="email" className={labelClasses}>
              Email <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="email"
                type="email"
                value={step1.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                autoComplete="off"
                className={getFieldClasses('email', step1.email, errors.email)}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className={fieldRowClasses}>
            <label htmlFor="phone" className={labelClasses}>
              Phone Number <span className="text-[#ef4444]">*</span>
            </label>
            <div className="min-w-0">
              <input
                id="phone"
                type="tel"
                value={step1.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleFieldBlur('phone')}
                autoComplete="off"
                className={getFieldClasses('phone', step1.phone, errors.phone)}
                placeholder="+353 1 234 5678"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
