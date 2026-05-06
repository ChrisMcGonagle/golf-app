'use client';

import { useEffect } from 'react';

const TOTAL_DURATION_MS = 4100;
const ANCHOR_TOP = '28%';
const FINAL_CIRCLE_SIZE_PX = 112;
const CARD_WIDTH = 'min(720px, calc(100vw - 3rem))';
const CARD_HEIGHT = 'clamp(240px, 32vh, 280px)';

interface SuccessCircleAnimationProps {
  onAnimationComplete: () => void;
  success?: boolean;
}

export default function SuccessCircleAnimation({ onAnimationComplete, success = true }: SuccessCircleAnimationProps) {
  useEffect(() => {
    const completionTimer = setTimeout(() => {
      onAnimationComplete();
    }, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(completionTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-gray-400"
        style={{
          animation: `greyBlindRevealAnimation ${TOTAL_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        }}
      />

      <div
        className="fixed left-1/2 top-0 bg-gray-400"
        style={{
          top: ANCHOR_TOP,
          width: `${FINAL_CIRCLE_SIZE_PX}px`,
          height: `${FINAL_CIRCLE_SIZE_PX}px`,
          borderRadius: '9999px',
          transform: 'translate(-50%, -50%) scale(12)',
          transformOrigin: 'center center',
          animation: `greyCircleShrinkAnimation ${TOTAL_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        }}
      />

      <div
        className="fixed left-1/2 bg-gray-400 shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
        style={{
          top: ANCHOR_TOP,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transform: 'translate(-50%, -50%) scale(0.16)',
          transformOrigin: 'center center',
          animation: `cardMorphAnimation ${TOTAL_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        }}
      />

      <div
        className="fixed left-1/2 z-20 flex items-end justify-start px-5 pb-9 pt-6 text-white sm:px-6 sm:pb-10 sm:pt-8 md:px-8"
        style={{
          top: ANCHOR_TOP,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transform: 'translate(-50%, -50%)',
          animation: `cardTextFadeAnimation ${TOTAL_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        }}
      >
        <div className="w-full max-w-[520px] text-left">
          <p className="whitespace-nowrap text-xl font-semibold tracking-[0.02em] sm:text-[1.75rem]">Great! You&apos;re all set.</p>
          <div className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
            <p className="block whitespace-nowrap">You are now a member of Cruit Island Golf Club</p>
            <p className="block whitespace-nowrap">You will receive an email within 24 hours with your membership details.</p>
            <p className="block whitespace-nowrap">If any additional information is required, we will be in touch.</p>
          </div>
        </div>
      </div>

      {success && (
        <div
          className="fixed z-10 flex items-center justify-center"
          style={{
            left: '50%',
            top: ANCHOR_TOP,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-20 w-20 sm:h-24 sm:w-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: `checkmarkAnimation ${TOTAL_DURATION_MS}ms ease-out forwards`,
                strokeDasharray: 40,
                strokeDashoffset: 40,
              }}
            />
          </svg>
        </div>
      )}

      <style>{`
        @keyframes greyBlindRevealAnimation {
          0% {
            clip-path: inset(0 0 100% 0);
            opacity: 1;
          }
          12% {
            clip-path: inset(0);
            opacity: 1;
          }

          20% {
            clip-path: inset(0);
            opacity: 1;
          }

          28% {
            clip-path: inset(0);
            opacity: 1;
          }

          34% {
            clip-path: inset(0);
            opacity: 0;
          }

          100% {
            clip-path: inset(0);
            opacity: 0;
          }
        }

        @keyframes greyCircleShrinkAnimation {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(12);
            border-radius: 28px;
          }

          12% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(12);
            border-radius: 28px;
          }

          16% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(12);
            border-radius: 28px;
          }

          42% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 9999px;
          }

          74% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 9999px;
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 9999px;
          }
        }

        @keyframes cardMorphAnimation {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.16);
            border-radius: 9999px;
          }
          74% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.16);
            border-radius: 9999px;
          }
          75% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.16);
            border-radius: 9999px;
          }
          92% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 0;
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            border-radius: 0;
          }
        }

        @keyframes cardTextFadeAnimation {
          0% {
            opacity: 0;
          }

          86% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }

        @keyframes checkmarkAnimation {
          0% {
            opacity: 0;
            stroke-dashoffset: 40;
          }

          50% {
            opacity: 0;
            stroke-dashoffset: 40;
          }
          66% {
            opacity: 1;
            stroke-dashoffset: 0;
          }
          74% {
            opacity: 1;
            stroke-dashoffset: 0;
          }
          75% {
            opacity: 1;
            stroke-dashoffset: 0;
          }
          82% {
            opacity: 0;
            stroke-dashoffset: 0;
          }
          100% {
            opacity: 0;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
