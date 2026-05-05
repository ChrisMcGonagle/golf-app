'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

interface PinEntryFormProps {
  action: string | ((formData: FormData) => Promise<{ success: boolean; error?: string; remaining?: number } | undefined>);
  profileId: string;
  error?: string;
  attempt?: number;
  onClearError?: () => void;
}

const PIN_LENGTH = 4;
const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function PinEntryForm({
  action,
  profileId,
  error,
  attempt = 0,
  onClearError,
}: PinEntryFormProps): JSX.Element {
  const [digits, setDigits] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isFlashingSuccess, setIsFlashingSuccess] = useState(false);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    captureInputRef.current?.focus();
  }, []);

  // Handle error prop changes
  useEffect(() => {
    if (error) {
      setIsPending(false);
      setIsFlashing(true);

      const flashTimeout = setTimeout(() => {
        setIsFlashing(false);
      }, 400);

      setDigits('');

      return () => clearTimeout(flashTimeout);
    }
  }, [error, attempt]);

  const focusCaptureInput = (): void => {
    if (isPending) {
      return;
    }

    captureInputRef.current?.focus();
  };

  const appendDigit = (nextDigit: string): void => {
    if (isPending) {
      return;
    }

    onClearError?.();

    setDigits((currentDigits) => {
      if (currentDigits.length >= PIN_LENGTH) {
        return currentDigits;
      }

      return `${currentDigits}${nextDigit}`;
    });

    focusCaptureInput();
  };

  const removeDigit = (): void => {
    if (isPending) {
      return;
    }

    onClearError?.();
    setDigits((currentDigits) => currentDigits.slice(0, -1));
    focusCaptureInput();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (isPending) {
      return;
    }

    const nextDigits = event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    onClearError?.();
    setDigits(nextDigits);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (isPending) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      removeDigit();
      return;
    }

    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (digits.length !== PIN_LENGTH || isPending) {
      return;
    }

    if (typeof action === 'string') {
      // action is a string URL, should not happen in this case but fallback
      return;
    }

    setIsPending(true);

    // Create FormData from the form
    const formData = new FormData(formRef.current!);

    try {
      // Call the server action
      const response = await action(formData) as { success: boolean; error?: string; remaining?: number } | undefined;

      if (response && response.success === true) {
        onClearError?.();
        setIsFlashingSuccess(true);

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 600);
      } else if (response && response.success === false) {
        // Immediately trigger red flash to avoid black-dot gap
        setIsPending(false);
        setIsFlashing(true);
        setDigits('');

        // Delay redirect to allow red flash to animate before page transition
        setTimeout(() => {
          const errorParam = response.error || 'invalid';
          const remainingParam = response.remaining ?? 5;
          window.location.href = `/pin?userId=${profileId}&error=${errorParam}&remaining=${remainingParam}&attempt=${attempt + 1}`;
        }, 600);
      }
    } catch (err) {
      // If there's an error in the submission, keep the form as is
      console.error('PIN validation error:', err);
    } finally {
      // Only clear pending if not already cleared by error handler
      if (isPending) {
        setIsPending(false);
      }
    }
  };

  useEffect(() => {
    if (digits.length === PIN_LENGTH) {
      // Submit the form with custom handler
      formRef.current?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    }
  }, [digits.length]);

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-6">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="attempt" value={attempt} />

      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          type="hidden"
          name={`digit_${index}`}
          value={digits[index] ?? ''}
          readOnly
        />
      ))}

      <div onClick={focusCaptureInput}>
        <label htmlFor="pin-capture" className="sr-only">
          PIN input
        </label>
        <input
          ref={captureInputRef}
          id="pin-capture"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          value={digits}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          disabled={isPending}
          className="sr-only"
        />

        <div className="flex items-center justify-center gap-5" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }, (_, index) => {
            const isFilled = index < digits.length;
            let backgroundColor = isFilled ? '#2b2b2b' : 'transparent';
            let animation = 'none';
            let opacity = 1;
            if (isFlashingSuccess) {
              backgroundColor = '#22c55e';
            } else if (isFlashing) {
              backgroundColor = '#ef4444';
            } else if (isPending) {
              backgroundColor = '#2b2b2b';
              animation = `pin-dot-wave 0.9s ease-in-out ${index * 0.12}s infinite`;
              opacity = 0.5;
            }

            return (
              <span
                key={index}
                className="h-6 w-6 rounded-full border-2 border-[#cccccc] transition-all duration-150"
                style={{
                  animation,
                  backgroundColor,
                  opacity,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-[300px] grid-cols-3 gap-5" aria-label="PIN keypad">
        {KEYPAD_DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => appendDigit(digit)}
            disabled={isPending}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f0f0] text-2xl font-semibold text-[#2b2b2b] transition hover:bg-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#2b2b2b]/15 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#f0f0f0]"
          >
            {digit}
          </button>
        ))}

        <div aria-hidden="true" />

        <button
          type="button"
          onClick={() => appendDigit('0')}
          disabled={isPending}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f0f0] text-2xl font-semibold text-[#2b2b2b] transition hover:bg-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#2b2b2b]/15 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#f0f0f0]"
        >
          0
        </button>

        <button
          type="button"
          onClick={removeDigit}
          disabled={isPending}
          className="flex h-20 w-20 items-center justify-center text-[#2b2b2b] transition-colors hover:text-[#969696] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-[#2b2b2b]"
          aria-label="Delete digit"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-12 w-12"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="13" y2="14" />
            <line x1="13" y1="9" x2="18" y2="14" />
          </svg>
        </button>
      </div>

      <div className="flex justify-center">
        <Link
          href="/select-user"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#969696] transition-colors hover:text-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b2b2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f5]"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Cancel</span>
        </Link>
      </div>

      <style jsx>{`
        @keyframes pin-dot-wave {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.82);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </form>
  );
}
