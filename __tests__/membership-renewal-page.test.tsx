import React from 'react';
import { render, screen } from '@testing-library/react';
import { unsealData } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

import MembershipRegistrationPage from '@/app/(authenticated)/dashboard/membership-registration/page';
import MembershipRenewalPage from '@/app/(authenticated)/dashboard/membership-renewal/page';
import { middleware } from '@/middleware';

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(() => ({ status: 200 })),
    redirect: jest.fn((url: URL) => ({
      status: 307,
      redirectUrl: url.toString(),
    })),
  },
}))

jest.mock('iron-session', () => ({
  unsealData: jest.fn(),
}))

const mockedUnsealData = jest.mocked(unsealData)

function createMockRequest(pathname: string, cookieValue?: string): NextRequest {
  const url = new URL(`http://localhost:3000${pathname}`)

  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      get: (name: string) => {
        if (name !== 'activeUser' || !cookieValue) {
          return undefined
        }

        return { value: cookieValue }
      },
    },
  } as NextRequest
}

const adminSession = {
  activeUser: {
    profileId: 'admin-123',
    displayName: 'Alex Admin',
    role: 'admin' as const,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  },
}

const staffSession = {
  activeUser: {
    profileId: 'staff-456',
    displayName: 'Sam Staff',
    role: 'staff' as const,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  },
}

describe('PBI-009: MembershipRenewalPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ACTIVE_USER_SECRET = 'test-secret-key'
  })

  it('shows the Membership Renewal entry link to /dashboard/membership-renewal', () => {
    render(<MembershipRegistrationPage />)

    const entryLink = screen.getByRole('link', { name: /membership renewal/i })

    expect(entryLink).toBeInTheDocument()
    expect(entryLink).toHaveAttribute('href', '/dashboard/membership-renewal')
  })

  it('renders the placeholder renewal page content', () => {
    render(<MembershipRenewalPage />)

    expect(
      screen.getByRole('heading', { name: /membership renewal/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/placeholder for membership renewal flow/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to membership registration/i })
    ).toHaveAttribute('href', '/dashboard/membership-registration')
  })

  it('redirects unauthenticated users from /dashboard/membership-renewal to /select-user', async () => {
    const request = createMockRequest('/dashboard/membership-renewal')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/select-user' })
    )
    expect(mockedUnsealData).not.toHaveBeenCalled()
  })

  it('allows staff users to access /dashboard/membership-renewal via middleware', async () => {
    mockedUnsealData.mockResolvedValueOnce(staffSession)
    const request = createMockRequest('/dashboard/membership-renewal', 'valid-staff-cookie')

    const response = await middleware(request)

    expect(response).toEqual({ status: 200 })
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('allows admin users to access /dashboard/membership-renewal via middleware', async () => {
    mockedUnsealData.mockResolvedValueOnce(adminSession)
    const request = createMockRequest('/dashboard/membership-renewal', 'valid-admin-cookie')

    const response = await middleware(request)

    expect(response).toEqual({ status: 200 })
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })
})