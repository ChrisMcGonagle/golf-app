'use client';

import { useEffect, useState } from 'react';
import PinEntryForm from './PinEntryForm';

interface PinEntryScreenProps {
  action: string | ((formData: FormData) => Promise<{ success: boolean; error?: string; remaining?: number } | undefined>);
  profileId: string;
  error?: string;
  remaining?: number | null;
  attempt?: number;
}

function getAlertMessage(error?: string, remaining?: number | null): string | null {
  if (!error) {
    return null;
  }

  if (error === 'invalid') {
    const remainingMessage =
      remaining !== null && remaining !== undefined && remaining > 0
        ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : '';

    return `Incorrect PIN.${remainingMessage}`;
  }

  return 'An error occurred. Please try again.';
}

export default function PinEntryScreen({
  action,
  profileId,
  error,
  remaining,
  attempt = 0,
}: PinEntryScreenProps): JSX.Element {
  const [currentError, setCurrentError] = useState(error);
  const [currentRemaining, setCurrentRemaining] = useState<number | null | undefined>(remaining);

  useEffect(() => {
    setCurrentError(error);
    setCurrentRemaining(remaining);
  }, [error, remaining, attempt]);

  const handleClearError = (): void => {
    setCurrentError(undefined);
    setCurrentRemaining(undefined);
  };

  const alertMessage = getAlertMessage(currentError, currentRemaining);

  return (
    <>
      <PinEntryForm
        action={action}
        profileId={profileId}
        error={error}
        attempt={attempt}
        onClearError={handleClearError}
      />

      <div className="mt-6 min-h-[80px]">
        {alertMessage && (
          <div
            role="alert"
            className="rounded-2xl px-4 py-3 text-sm"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {alertMessage}
          </div>
        )}
      </div>
    </>
  );
}