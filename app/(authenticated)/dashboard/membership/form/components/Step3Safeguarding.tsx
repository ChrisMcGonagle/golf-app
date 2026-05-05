'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Step3Data } from '@/components/contexts/FormContext';

interface Step3SafeguardingProps {
  onValidationChange: (isValid: boolean) => void;
}

export default function Step3Safeguarding({
  onValidationChange,
}: Step3SafeguardingProps) {
  const { step3, setStep3 } = useFormContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Step3Data, string>>>({});

  const validateStep = () => {
    const newErrors: Partial<Record<keyof Step3Data, string>> = {};

    // Required fields
    if (!step3.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }
    if (!step3.emergencyContactRelationship.trim()) {
      newErrors.emergencyContactRelationship = 'Emergency contact relationship is required';
    }
    if (!step3.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency phone is required';
    }

    // Phone validation
    if (step3.emergencyPhone.trim()) {
      const phoneRegex = /^[\d\s\-+()]+$/;
      if (!phoneRegex.test(step3.emergencyPhone)) {
        newErrors.emergencyPhone = 'Please enter a valid phone number';
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
  }, [step3]);

  const handleChange = (field: keyof Step3Data, value: string) => {
    setStep3({ [field]: value });
  };

  const inputClasses =
    'w-full rounded-lg border border-[#eeeeee] px-3 py-2 text-sm placeholder-[#969696] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const textareaClasses = `${inputClasses} resize-none`;
  const labelClasses = 'block text-sm font-medium text-[#2b2b2b] mb-2';

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#2b2b2b]">Safeguarding & Medical</h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="emergencyContactName" className={labelClasses}>
            Emergency Contact Name *
          </label>
          <input
            id="emergencyContactName"
            type="text"
            value={step3.emergencyContactName}
            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
            className={inputClasses}
            placeholder="John Smith"
          />
          {errors.emergencyContactName && (
            <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
          )}
        </div>

        <div>
          <label htmlFor="emergencyContactRelationship" className={labelClasses}>
            Relationship *
          </label>
          <input
            id="emergencyContactRelationship"
            type="text"
            value={step3.emergencyContactRelationship}
            onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
            className={inputClasses}
            placeholder="Spouse, Parent, Sibling, etc."
          />
          {errors.emergencyContactRelationship && (
            <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="emergencyPhone" className={labelClasses}>
          Emergency Phone *
        </label>
        <input
          id="emergencyPhone"
          type="tel"
          value={step3.emergencyPhone}
          onChange={(e) => handleChange('emergencyPhone', e.target.value)}
          className={inputClasses}
          placeholder="+353 1 234 5678"
        />
        {errors.emergencyPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.emergencyPhone}</p>
        )}
      </div>

      <div>
        <label htmlFor="allergies" className={labelClasses}>
          Allergies
        </label>
        <textarea
          id="allergies"
          value={step3.allergies}
          onChange={(e) => handleChange('allergies', e.target.value)}
          className={textareaClasses}
          rows={4}
          placeholder="Please list any allergies we should be aware of"
        />
      </div>

      <div>
        <label htmlFor="medications" className={labelClasses}>
          Medications
        </label>
        <textarea
          id="medications"
          value={step3.medications}
          onChange={(e) => handleChange('medications', e.target.value)}
          className={textareaClasses}
          rows={4}
          placeholder="Please list any medications you are currently taking"
        />
      </div>

      <div>
        <label htmlFor="additionalAssistance" className={labelClasses}>
          Additional Assistance
        </label>
        <textarea
          id="additionalAssistance"
          value={step3.additionalAssistance}
          onChange={(e) => handleChange('additionalAssistance', e.target.value)}
          className={textareaClasses}
          rows={4}
          placeholder="Please describe any additional assistance or accommodations you may need"
        />
      </div>
    </div>
  );
}
