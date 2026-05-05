'use client';

import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Step4Data, useFormContext } from '@/components/contexts/FormContext';

interface Step4PlaceholderProps {
  onValidationChange: (isValid: boolean) => void;
}

const REQUIRED_FIELDS_ORDER: (keyof Step4Data)[] = [
  'acceptedTerms',
  'acceptedGdpr',
  'signature',
];

export default function Step4Placeholder({
  onValidationChange,
}: Step4PlaceholderProps) {
  const { step4, setStep4 } = useFormContext();
  const signaturePadRef = useRef<SignatureCanvas | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Step4Data, string>>>({});
  const [blurredFields, setBlurredFields] = useState<Partial<Record<keyof Step4Data, boolean>>>({});

  const getFirstEmptyRequiredField = (): keyof Step4Data | null => {
    for (const field of REQUIRED_FIELDS_ORDER) {
      if (field === 'signature') {
        if (!step4.signature) {
          return field;
        }
        continue;
      }

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

    if (firstEmpty === 'signature') {
      newErrors.signature = 'Please provide your signature';
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

  useEffect(() => {
    const pad = signaturePadRef.current;
    if (!pad || typeof pad.getCanvas !== 'function') return;
    const canvas = pad.getCanvas();
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      pad.clear();
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const pad = signaturePadRef.current;
      if (!pad || typeof pad.getCanvas !== 'function') return;
      const canvas = pad.getCanvas();
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        pad.clear();
        setStep4({ signature: '' });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setStep4]);

  useEffect(() => {
    const signaturePad = signaturePadRef.current;

    if (!signaturePad) {
      return;
    }

    if (step4.signature) {
      if (signaturePad.isEmpty()) {
        signaturePad.fromDataURL(step4.signature);
      }
      return;
    }

    if (!signaturePad.isEmpty()) {
      signaturePad.clear();
    }
  }, [step4.signature]);

  const handleChange = (field: keyof Step4Data, checked: boolean) => {
    setStep4({ [field]: checked ? 'true' : '' });
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleFieldBlur = (field: keyof Step4Data) => {
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleSignatureEnd = () => {
    const signaturePad = signaturePadRef.current;

    if (!signaturePad) {
      return;
    }

    const signature = signaturePad.isEmpty()
      ? ''
      : signaturePad.toDataURL('image/png');

    setStep4({ signature });
    setBlurredFields((prev) => ({ ...prev, signature: true }));
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
    setStep4({ signature: '' });
    setBlurredFields((prev) => ({ ...prev, signature: true }));
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

  const getSignatureContainerClasses = () => {
    if (errors.signature) {
      return 'rounded border border-red-500 bg-white p-2 transition-colors';
    }

    if (blurredFields.signature && step4.signature) {
      return 'rounded border border-[#22c55e] bg-white p-2 transition-colors';
    }

    return 'rounded border border-[#eeeeee] bg-white p-2 transition-colors';
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2b2b2b]" htmlFor="membership-signature-pad">
            Please provide your signature
          </label>

          <div className={getSignatureContainerClasses()}>
            <SignatureCanvas
              ref={signaturePadRef}
              onEnd={handleSignatureEnd}
              penColor="#2b2b2b"
              canvasProps={{
                id: 'membership-signature-pad',
                'aria-label': 'Membership signature pad',
                className: 'h-[200px] w-full rounded',
              }}
            />
          </div>

          <div className="flex w-full justify-end">
            <button
              type="button"
              onClick={handleClearSignature}
              className="text-sm font-medium text-[#2b2b2b] underline underline-offset-2 transition-colors hover:text-[#1a1a1a]"
            >
              Clear
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
