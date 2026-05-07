import React from 'react'
import { render, screen } from '@testing-library/react'
import HickoryBrand from '@/components/HickoryBrand'
import HickoryBrandVertical from '@/components/HickoryBrandVertical'

describe('HickoryBrand', () => {
  it('renders text "HICKORY" in the DOM', () => {
    render(<HickoryBrand />)
    expect(screen.getByText('HICKORY')).toBeInTheDocument()
  })
})

describe('HickoryBrandVertical', () => {
  it('renders text "HICKORY" in the DOM', () => {
    render(<HickoryBrandVertical />)
    expect(screen.getByText('HICKORY')).toBeInTheDocument()
  })
})
