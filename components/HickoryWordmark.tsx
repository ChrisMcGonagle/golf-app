'use client'
import React from 'react'

interface HickoryWordmarkProps {
  className?: string
  style?: React.CSSProperties
}

export default function HickoryWordmark({ className, style }: HickoryWordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-cormorant), serif',
        fontWeight: 600,
        letterSpacing: '0.18em',
        color: '#1E2A26',
        fontSize: 'inherit',
        ...style,
      }}
    >
      HICKORY
    </span>
  )
}
