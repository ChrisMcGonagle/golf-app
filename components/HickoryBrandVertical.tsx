'use client'
import React from 'react'
import HickoryClubIcon from './HickoryClubIcon'
import HickoryWordmark from './HickoryWordmark'

export default function HickoryBrandVertical() {
  return (
    <div className="flex flex-col items-center gap-[12px]">
      <HickoryClubIcon className="h-8 w-8" />
      <HickoryWordmark style={{ fontSize: '1.125rem' }} />
    </div>
  )
}
