'use client';

import { useFormContext } from '@/components/contexts/FormContext';

export default function Step4Placeholder(): React.ReactNode {
  const { flow } = useFormContext();

  return (
    <div className="space-y-6">
      <p className="text-[#2b2b2b]">
        Consent information and additional details will be available in a future update.
      </p>

      {/* Display flow context to verify it's available */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Form Summary:</strong> {flow.intent === 'renewal' ? 'Renewal' : 'New Membership'} - {flow.typeId}
          {flow.memberId && ` - Member ID: ${flow.memberId}`}
        </p>
      </div>
    </div>
  );
}
