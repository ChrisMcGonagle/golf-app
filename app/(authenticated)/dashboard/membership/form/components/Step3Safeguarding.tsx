'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Step3Data } from '@/components/contexts/FormContext';

interface Step3SafeguardingProps {
  onValidationChange: (isValid: boolean) => void;
}

const REQUIRED_FIELDS_ORDER: (keyof Step3Data)[] = [
  'emergencyContactName',
  'emergencyContactRelationship',
  'emergencyPhone',
];

export default function Step3Safeguarding({
  onValidationChange,
}: Step3SafeguardingProps) {
  const { step3, setStep3 } = useFormContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Step3Data, string>>>({});
  const [blurredFields, setBlurredFields] = useState<Partial<Record<keyof Step3Data, boolean>>>({});

  // Find the first empty required field in order
  const getFirstEmptyRequiredField = (): keyof Step3Data | null => {
    for (const field of REQUIRED_FIELDS_ORDER) {
      if (!step3[field].trim()) {
        return field;
      }
    }
    return null;
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof Step3Data, string>> = {};
    const firstEmpty = getFirstEmptyRequiredField();

    // Only mark the first empty required field as required error
    if (firstEmpty) {
      if (firstEmpty === 'emergencyContactName') {
        newErrors.emergencyContactName = 'Emergency contact name is required';
      }
      if (firstEmpty === 'emergencyContactRelationship') {
        newErrors.emergencyContactRelationship = 'Emergency contact relationship is required';
      }
      if (firstEmpty === 'emergencyPhone') {
        newErrors.emergencyPhone = 'Emergency phone is required';
      }
    }

    // Phone validation (format error)
    if (step3.emergencyPhone.trim()) {
      const phoneRegex = /^[+\d\s\-().x,#*]+$/i;
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

  const handleFieldBlur = (field: keyof Step3Data) => {
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  const inputClasses =
    'w-full border-0 border-b-2 border-[#eeeeee] bg-transparent px-0 py-2 text-xs text-[#6f6f6f] placeholder:text-xs placeholder:text-[#969696] focus:border-[#d4d4d4] focus:outline-none';
  const textareaBoxClasses = `w-full border-2 border-[#eeeeee] bg-transparent px-3 py-2 text-xs text-[#6f6f6f] placeholder:text-xs placeholder:text-[#969696] focus:border-[#d4d4d4] focus:outline-none rounded resize-none`;
  const fieldRowClasses = 'grid grid-cols-[28rem_minmax(0,1fr)] items-center gap-3';
  const textareaRowClasses = 'grid grid-cols-[28rem_minmax(0,1fr)] items-start gap-3';
  const labelClasses = 'text-xs font-bold leading-4 text-[#2b2b2b]';
  const getFieldClasses = (
    field: keyof Step3Data,
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
    <div className="space-y-6">

      <h3 className="mb-3 inline-block border-b border-[#eeeeee] text-xs font-semibold text-[#2b2b2b]">
        Emergency Contact :
      </h3>

      <div className={fieldRowClasses}>
        <label htmlFor="emergencyContactName" className={labelClasses}>
          Emergency Contact Name <span className="text-[#ef4444]">*</span>
        </label>
        <div className="min-w-0">
          <input
            id="emergencyContactName"
            type="text"
            value={step3.emergencyContactName}
            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
            onBlur={() => handleFieldBlur('emergencyContactName')}
            autoComplete="off"
            className={getFieldClasses('emergencyContactName', step3.emergencyContactName, errors.emergencyContactName)}
            placeholder="John Smith"
          />
        </div>
      </div>

      <div className={fieldRowClasses}>
        <label htmlFor="emergencyContactRelationship" className={labelClasses}>
          Emergency Contact Relationship <span className="text-[#ef4444]">*</span>
        </label>
        <div className="min-w-0">
          <input
            id="emergencyContactRelationship"
            type="text"
            value={step3.emergencyContactRelationship}
            onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
            onBlur={() => handleFieldBlur('emergencyContactRelationship')}
            autoComplete="off"
            className={getFieldClasses('emergencyContactRelationship', step3.emergencyContactRelationship, errors.emergencyContactRelationship)}
            placeholder="Spouse, Parent, Sibling, etc."
          />
        </div>
      </div>

      <div className={fieldRowClasses}>
        <label htmlFor="emergencyPhone" className={labelClasses}>
          Emergency Contact Phone Number <span className="text-[#ef4444]">*</span>
        </label>
        <div className="min-w-0">
          <input
            id="emergencyPhone"
            type="tel"
            value={step3.emergencyPhone}
            onChange={(e) => handleChange('emergencyPhone', e.target.value)}
            onBlur={() => handleFieldBlur('emergencyPhone')}
            autoComplete="off"
            className={getFieldClasses('emergencyPhone', step3.emergencyPhone, errors.emergencyPhone)}
            placeholder="+353 1 234 5678"
          />
        </div>
      </div>

      <h3 className="mb-3 inline-block border-b border-[#eeeeee] text-xs font-semibold text-[#2b2b2b]">
        Medical & Additional Needs :
      </h3>

      <div className={textareaRowClasses}>
        <label htmlFor="medicalConditions" className={labelClasses}>
          Medical Conditions
        </label>
        <div className="min-w-0">
          <textarea
            id="medicalConditions"
            value={step3.medicalConditions}
            onChange={(e) => handleChange('medicalConditions', e.target.value)}
            onBlur={() => handleFieldBlur('medicalConditions')}
            autoComplete="off"
            className={getFieldClasses('medicalConditions', step3.medicalConditions, undefined, textareaBoxClasses)}
            rows={4}
            placeholder="Please list any medical conditions we should be aware of"
          />
        </div>
      </div>

      <div className={textareaRowClasses}>
        <label htmlFor="allergies" className={labelClasses}>
          Allergies
        </label>
        <div className="min-w-0">
          <textarea
            id="allergies"
            value={step3.allergies}
            onChange={(e) => handleChange('allergies', e.target.value)}
            onBlur={() => handleFieldBlur('allergies')}
            autoComplete="off"
            className={getFieldClasses('allergies', step3.allergies, undefined, textareaBoxClasses)}
            rows={4}
            placeholder="Please list any allergies we should be aware of"
          />
        </div>
      </div>

      <div className={textareaRowClasses}>
        <label htmlFor="medications" className={labelClasses}>
          Medications
        </label>
        <div className="min-w-0">
          <textarea
            id="medications"
            value={step3.medications}
            onChange={(e) => handleChange('medications', e.target.value)}
            onBlur={() => handleFieldBlur('medications')}
            autoComplete="off"
            className={getFieldClasses('medications', step3.medications, undefined, textareaBoxClasses)}
            rows={4}
            placeholder="Please list any medications you are currently taking"
          />
        </div>
      </div>

      <div className={textareaRowClasses}>
        <label htmlFor="additionalAssistance" className={labelClasses}>
          Additional Assistance
        </label>
        <div className="min-w-0">
          <textarea
            id="additionalAssistance"
            value={step3.additionalAssistance}
            onChange={(e) => handleChange('additionalAssistance', e.target.value)}
            onBlur={() => handleFieldBlur('additionalAssistance')}
            autoComplete="off"
            className={getFieldClasses('additionalAssistance', step3.additionalAssistance, undefined, textareaBoxClasses)}
            rows={4}
            placeholder="Please describe any additional assistance or accommodations you may need"
          />
        </div>
      </div>
    </div>
  );
}
