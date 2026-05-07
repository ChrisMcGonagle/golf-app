'use client'
import React from 'react'

interface HickoryClubIconProps {
  color?: string
  className?: string
}

export default function HickoryClubIcon({ color = '#B08D57', className }: HickoryClubIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Club head body — rounded rectangle at bottom */}
      <rect x="2" y="14" width="14" height="6" rx="2" />
      {/* Hosel rising from heel */}
      <line x1="14" y1="14" x2="18" y2="4" />
      {/* Shaft extending up */}
      <line x1="18" y1="4" x2="22" y2="2" />
      {/* Engraving detail line on club face */}
      <line x1="3" y1="17" x2="15" y2="17" />
    </svg>
  )
}
