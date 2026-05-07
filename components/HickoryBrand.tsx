'use client'
import React from 'react'
import HickoryClubIcon from './HickoryClubIcon'
import HickoryWordmark from './HickoryWordmark'

interface HickoryBrandProps {
  className?: string
}

export default function HickoryBrand({ className }: HickoryBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <HickoryClubIcon className="h-5 w-5" />
      <HickoryWordmark style={{ fontSize: '1.125rem' }} />
    </div>
  )
}
