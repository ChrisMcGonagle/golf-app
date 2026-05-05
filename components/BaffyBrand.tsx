import React from 'react';

export default function BaffyBrand() {
  return (
    <div className="flex items-center gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        style={{ color: '#2b2b2b' }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="2" x2="19" y2="16" />
        <path d="M19 16 Q22 17 21 20 Q20 23 17 22 L15 18 Z" />
      </svg>
      <span className="text-lg font-semibold tracking-wide text-[#2b2b2b]">Baffy</span>
    </div>
  );
}
