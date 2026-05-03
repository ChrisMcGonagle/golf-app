import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'

import { middleware } from '@/middleware'

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

describe('middleware role-based protection without database access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ACTIVE_USER_SECRET = 'test-secret-key'
  })

  it('passes public routes through without a cookie', async () => {
    const request = createMockRequest('/select-user')

    await middleware(request)

    expect(NextResponse.next).toHaveBeenCalledTimes(1)
    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(mockedUnsealData).not.toHaveBeenCalled()
  })

  it('redirects a protected route without a cookie to /select-user', async () => {
    const request = createMockRequest('/dashboard')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/select-user' })
    )
    expect(mockedUnsealData).not.toHaveBeenCalled()
  })

  it('redirects an invalid cookie on a protected route to /select-user', async () => {
    mockedUnsealData.mockRejectedValueOnce(new Error('invalid cookie'))
    const request = createMockRequest('/staff/members', 'tampered-cookie')

    await middleware(request)

    expect(mockedUnsealData).toHaveBeenCalledWith('tampered-cookie', {
      password: 'test-secret-key',
    })
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/select-user' })
    )
  })

  it('redirects an admin cookie away from /staff/members to /dashboard', async () => {
    mockedUnsealData.mockResolvedValueOnce(adminSession)
    const request = createMockRequest('/staff/members', 'valid-admin-cookie')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    )
  })

  it('redirects a staff cookie away from /staff/members to /dashboard', async () => {
    mockedUnsealData.mockResolvedValueOnce(staffSession)
    const request = createMockRequest('/staff/members', 'valid-staff-cookie')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    )
  })

  it('allows an admin cookie to access /dashboard', async () => {
    mockedUnsealData.mockResolvedValueOnce(adminSession)
    const request = createMockRequest('/dashboard', 'valid-admin-cookie')

    await middleware(request)

    expect(NextResponse.next).toHaveBeenCalledTimes(1)
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('allows an admin cookie to access /dashboard/submissions', async () => {
    mockedUnsealData.mockResolvedValueOnce(adminSession)
    const request = createMockRequest('/dashboard/submissions', 'valid-admin-cookie')

    await middleware(request)

    expect(NextResponse.next).toHaveBeenCalledTimes(1)
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('allows an admin cookie to access /dashboard/members', async () => {
    mockedUnsealData.mockResolvedValueOnce(adminSession)
    const request = createMockRequest('/dashboard/members', 'valid-admin-cookie')

    await middleware(request)

    expect(NextResponse.next).toHaveBeenCalledTimes(1)
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('redirects an admin cookie away from /dashboard/membership-registration to /dashboard', async () => {
    mockedUnsealData.mockResolvedValueOnce(adminSession)
    const request = createMockRequest('/dashboard/membership-registration', 'valid-admin-cookie')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' })
    )
  })

  it('allows a staff cookie to access /dashboard/membership-registration', async () => {
    mockedUnsealData.mockResolvedValueOnce(staffSession)
    const request = createMockRequest('/dashboard/membership-registration', 'valid-staff-cookie')

    await middleware(request)

    expect(NextResponse.next).toHaveBeenCalledTimes(1)
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('redirects a staff cookie away from /dashboard to /dashboard/membership-registration', async () => {
    mockedUnsealData.mockResolvedValueOnce(staffSession)
    const request = createMockRequest('/dashboard', 'valid-staff-cookie')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard/membership-registration' })
    )
  })

  it('redirects a staff cookie away from /dashboard/submissions to /dashboard/membership-registration', async () => {
    mockedUnsealData.mockResolvedValueOnce(staffSession)
    const request = createMockRequest('/dashboard/submissions', 'valid-staff-cookie')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard/membership-registration' })
    )
  })

  it('redirects a staff cookie away from /dashboard/members to /dashboard/membership-registration', async () => {
    mockedUnsealData.mockResolvedValueOnce(staffSession)
    const request = createMockRequest('/dashboard/members', 'valid-staff-cookie')

    await middleware(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard/membership-registration' })
    )
  })
})
