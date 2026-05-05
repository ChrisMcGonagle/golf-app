'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Step1Data } from '@/components/contexts/FormContext';

interface Step1PersonalProps {
  onValidationChange: (isValid: boolean) => void;
}

export default function Step1Personal({
  onValidationChange,
}: Step1PersonalProps) {
  const { step1, setStep1, flow } = useFormContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});

  const validateStep = () => {
    const newErrors: Partial<Record<keyof Step1Data, string>> = {};

    // Required fields
    if (!step1.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!step1.surname.trim()) newErrors.surname = 'Surname is required';
    if (!step1.dob.trim()) newErrors.dob = 'Date of birth is required';
    if (!step1.gender.trim()) newErrors.gender = 'Gender is required';
    if (!step1.address1.trim()) newErrors.address1 = 'Address line 1 is required';
    if (!step1.city.trim()) newErrors.city = 'City is required';
    if (!step1.county.trim()) newErrors.county = 'County is required';
    if (!step1.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!step1.country.trim()) newErrors.country = 'Country is required';
    if (!step1.email.trim()) newErrors.email = 'Email is required';
    if (!step1.phone.trim()) newErrors.phone = 'Phone number is required';

    // Email validation
    if (step1.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Date validation
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

  const inputClasses =
    'w-full rounded-lg border border-[#eeeeee] px-3 py-2 text-sm placeholder-[#969696] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const selectClasses = inputClasses;
  const labelClasses = 'block text-sm font-medium text-[#2b2b2b] mb-2';

  return (
    <div className="space-y-6">

      {/* Display flow context to verify it's available */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-900">
          <strong>Journey:</strong> {flow.intent === 'renewal' ? 'Renewal' : 'New Membership'} - {flow.typeId}
          {flow.memberId && ` - Member: ${flow.memberId}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClasses}>
            First Name *
          </label>
          <input
            id="firstName"
            type="text"
            value={step1.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className={inputClasses}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="surname" className={labelClasses}>
            Surname *
          </label>
          <input
            id="surname"
            type="text"
            value={step1.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
            className={inputClasses}
            placeholder="Doe"
          />
          {errors.surname && (
            <p className="mt-1 text-sm text-red-600">{errors.surname}</p>
          )}
        </div>

        <div>
          <label htmlFor="dob" className={labelClasses}>
            Date of Birth *
          </label>
          <input
            id="dob"
            type="date"
            value={step1.dob}
            onChange={(e) => handleChange('dob', e.target.value)}
            className={inputClasses}
          />
          {errors.dob && (
            <p className="mt-1 text-sm text-red-600">{errors.dob}</p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className={labelClasses}>
            Gender *
          </label>
          <select
            id="gender"
            value={step1.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className={selectClasses}
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="address1" className={labelClasses}>
          Address Line 1 *
        </label>
        <input
          id="address1"
          type="text"
          value={step1.address1}
          onChange={(e) => handleChange('address1', e.target.value)}
          className={inputClasses}
          placeholder="123 Main Street"
        />
        {errors.address1 && (
          <p className="mt-1 text-sm text-red-600">{errors.address1}</p>
        )}
      </div>

      <div>
        <label htmlFor="address2" className={labelClasses}>
          Address Line 2
        </label>
        <input
          id="address2"
          type="text"
          value={step1.address2}
          onChange={(e) => handleChange('address2', e.target.value)}
          className={inputClasses}
          placeholder="Apartment 4B"
        />
      </div>

      <div>
        <label htmlFor="address3" className={labelClasses}>
          Address Line 3
        </label>
        <input
          id="address3"
          type="text"
          value={step1.address3}
          onChange={(e) => handleChange('address3', e.target.value)}
          className={inputClasses}
          placeholder="Building 3"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClasses}>
            City *
          </label>
          <input
            id="city"
            type="text"
            value={step1.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className={inputClasses}
            placeholder="Dublin"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>

        <div>
          <label htmlFor="county" className={labelClasses}>
            County *
          </label>
          <input
            id="county"
            type="text"
            value={step1.county}
            onChange={(e) => handleChange('county', e.target.value)}
            className={inputClasses}
            placeholder="Dublin"
          />
          {errors.county && (
            <p className="mt-1 text-sm text-red-600">{errors.county}</p>
          )}
        </div>

        <div>
          <label htmlFor="postalCode" className={labelClasses}>
            Postal Code *
          </label>
          <input
            id="postalCode"
            type="text"
            value={step1.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            className={inputClasses}
            placeholder="D01 1AA"
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
          )}
        </div>

        <div>
          <label htmlFor="country" className={labelClasses}>
            Country *
          </label>
          <input
            id="country"
            type="text"
            value={step1.country}
            onChange={(e) => handleChange('country', e.target.value)}
            className={inputClasses}
            placeholder="Ireland"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClasses}>
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={step1.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={inputClasses}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className={labelClasses}>
          Phone Number *
        </label>
        <input
          id="phone"
          type="tel"
          value={step1.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className={inputClasses}
          placeholder="+353 1 234 5678"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>
    </div>
  );
}
