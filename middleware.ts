import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)',
  ],
}

interface ActiveUserSession {
  activeUser?: {
    profileId: string
    displayName: string
    role: 'staff' | 'admin'
    expiresAt: number
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isStaffRoute = pathname === '/staff' || pathname.startsWith('/staff/')

  if (!isDashboardRoute && !isStaffRoute) {
    return NextResponse.next()
  }

  try {
    const password = process.env.ACTIVE_USER_SECRET || ''
    if (!password) {
      throw new Error('ACTIVE_USER_SECRET is not set')
    }

    // Get the sealed cookie value
    const cookieValue = request.cookies.get('activeUser')?.value

    if (!cookieValue) {
      return NextResponse.redirect(new URL('/select-user', request.url))
    }

    // Unseal the cookie to validate signature and get session data
    const session = await unsealData<ActiveUserSession>(cookieValue, {
      password,
    })

    // No active user found
    if (!session.activeUser) {
      return NextResponse.redirect(new URL('/select-user', request.url))
    }

    const { role } = session.activeUser

    if (isStaffRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const isAdminOnlyRoute =
      pathname === '/dashboard' ||
      pathname === '/dashboard/submissions' ||
      pathname.startsWith('/dashboard/submissions/') ||
      pathname === '/dashboard/members' ||
      pathname.startsWith('/dashboard/members/')

    const isSharedDashboardRoute =
      pathname === '/dashboard/membership-registration' ||
      pathname.startsWith('/dashboard/membership-registration/') ||
      pathname === '/dashboard/new-member' ||
      pathname.startsWith('/dashboard/new-member/')

    if (role === 'admin') {
      return NextResponse.next()
    }

    if (role === 'staff') {
      if (isAdminOnlyRoute) {
        return NextResponse.redirect(new URL('/dashboard/membership-registration', request.url))
      }

      if (isSharedDashboardRoute) {
        return NextResponse.next()
      }

      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/select-user', request.url))
  } catch {
    return NextResponse.redirect(new URL('/select-user', request.url))
  }
}
