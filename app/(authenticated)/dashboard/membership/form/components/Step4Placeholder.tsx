'use client';

import { useEffect, useState } from 'react';
import { Step4Data, useFormContext } from '@/components/contexts/FormContext';

interface Step4PlaceholderProps {
  onValidationChange: (isValid: boolean) => void;
}

const REQUIRED_FIELDS_ORDER: (keyof Step4Data)[] = [
  'acceptedTerms',
  'acceptedGdpr',
];

export default function Step4Placeholder({
  onValidationChange,
}: Step4PlaceholderProps) {
  const { step4, setStep4 } = useFormContext();
  const [errors, setErrors] = useState<Partial<Record<keyof Step4Data, string>>>({});
  const [blurredFields, setBlurredFields] = useState<Partial<Record<keyof Step4Data, boolean>>>({});

  const getFirstEmptyRequiredField = (): keyof Step4Data | null => {
    for (const field of REQUIRED_FIELDS_ORDER) {
      if (step4[field] !== 'true') {
        return field;
      }
    }
    return null;
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof Step4Data, string>> = {};
    const firstEmpty = getFirstEmptyRequiredField();

    if (firstEmpty === 'acceptedTerms') {
      newErrors.acceptedTerms = 'You must accept the Terms & Conditions';
    }

    if (firstEmpty === 'acceptedGdpr') {
      newErrors.acceptedGdpr = 'You must accept the GDPR and data-processing terms';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
    return isValid;
  };

  useEffect(() => {
    validateStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step4]);

  const handleChange = (field: keyof Step4Data, checked: boolean) => {
    setStep4({ [field]: checked ? 'true' : '' });
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleFieldBlur = (field: keyof Step4Data) => {
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  const getCheckboxContainerClasses = (field: keyof Step4Data) => {
    if (errors[field]) {
      return 'rounded border border-red-500 p-4 transition-colors';
    }

    if (blurredFields[field] && step4[field] === 'true') {
      return 'rounded border border-[#22c55e] p-4 transition-colors';
    }

    return 'rounded border border-[#eeeeee] p-4 transition-colors';
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-[#2b2b2b]">
        Please read our Membership Terms &amp; Conditions before confirming your consent below.
      </p>

      <div className="rounded border border-[#eeeeee] bg-[#f5f6f5] px-4 py-3 text-xs font-medium text-[#6f6f6f]">
        Membership Terms &amp; Conditions coming soon
      </div>

      <div className="space-y-4">
        <div className={getCheckboxContainerClasses('acceptedTerms')}>
          <label htmlFor="acceptedTerms" className="flex items-start gap-3 text-sm text-[#2b2b2b]">
            <input
              id="acceptedTerms"
              type="checkbox"
              checked={step4.acceptedTerms === 'true'}
              onChange={(e) => handleChange('acceptedTerms', e.target.checked)}
              onBlur={() => handleFieldBlur('acceptedTerms')}
              className="mt-0.5 h-4 w-4 rounded border-[#d4d4d4] text-[#2b2b2b] focus:ring-[#2b2b2b]"
            />
            <span className="text-xs leading-5 text-[#2b2b2b]">
              By ticking this box I confirm I have read and agree to be bound by the Terms &amp; Conditions of Annual Subscription*
            </span>
          </label>
        </div>

        <div className={getCheckboxContainerClasses('acceptedGdpr')}>
          <label htmlFor="acceptedGdpr" className="flex items-start gap-3 text-sm text-[#2b2b2b]">
            <input
              id="acceptedGdpr"
              type="checkbox"
              checked={step4.acceptedGdpr === 'true'}
              onChange={(e) => handleChange('acceptedGdpr', e.target.checked)}
              onBlur={() => handleFieldBlur('acceptedGdpr')}
              className="mt-0.5 h-4 w-4 rounded border-[#d4d4d4] text-[#2b2b2b] focus:ring-[#2b2b2b]"
            />
            <span className="text-xs leading-5 text-[#2b2b2b]">
              I confirm that I have read and accept the GDPR and data-processing terms, and I consent to my information being used for the purposes stated in this form.*
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
