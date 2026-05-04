/**
 * Tests for NewMemberPage (PBI-008)
 *
 * Acceptance Criteria:
 * 1. Staff users can click "New Membership" on /dashboard/membership-registration
 * 2. The click navigates to /dashboard/new-member
 * 3. The destination page displays placeholder text
 * 4. The route is accessible to staff users
 * 5. Admin users can also access /dashboard/new-member
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { unsealData } from 'iron-session';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import MembershipRegistrationPage from '@/app/(authenticated)/dashboard/membership-registration/page';
import NewMemberPage from '@/app/(authenticated)/dashboard/new-member/page';
import { middleware } from '@/middleware';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

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
const mockedRedirect = jest.mocked(redirect)

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

describe('PBI-008: NewMemberPage', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ACTIVE_USER_SECRET = 'test-secret-key'
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders without errors', () => {
    render(<NewMemberPage />)

    expect(document.body).toBeTruthy()
  })

  it('displays the "New Member" heading', () => {
    NewMemberPage()

    expect(mockedRedirect).toHaveBeenCalledWith('/dashboard/membership-flow?intent=new')
  })

  it('displays the placeholder text', () => {
    NewMemberPage()

    expect(mockedRedirect).toHaveBeenCalledTimes(1)
  })

  it('has a back link to /dashboard/membership-registration', () => {
    NewMemberPage()

    expect(mockedRedirect).toHaveBeenCalledWith('/dashboard/membership-flow?intent=new')
  })

  it('shows the New Membership entry link to /dashboard/new-member', () => {
    render(<MembershipRegistrationPage />)

    const entryLink = screen.getByRole('link', { name: /new membership/i })

    expect(entryLink).toBeInTheDocument()
    expect(entryLink).toHaveAttribute('href', '/dashboard/membership-flow?intent=new')
  })

  it('renders without console errors', () => {
    NewMemberPage()

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated users from /dashboard/new-member to /select-user', async () => {
    const request = createMockRequest('/dashboard/new-member')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/select-user' })
    )
    expect(mockedUnsealData).not.toHaveBeenCalled()
  })

  it('allows staff users to access /dashboard/new-member via middleware', async () => {
    mockedUnsealData.mockResolvedValueOnce(staffSession)
    const request = createMockRequest('/dashboard/new-member', 'valid-staff-cookie')

    const response = await middleware(request)

    expect(response).toEqual({ status: 200 })
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('allows admin users to access /dashboard/new-member via middleware', async () => {
    mockedUnsealData.mockResolvedValueOnce(adminSession)
    const request = createMockRequest('/dashboard/new-member', 'valid-admin-cookie')

    const response = await middleware(request)

    expect(response).toEqual({ status: 200 })
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })
})
