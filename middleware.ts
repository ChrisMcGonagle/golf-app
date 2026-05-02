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
      // /staff routes not ready yet, redirect to /dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isDashboardRoute) {
      // Allow both staff and admin roles on /dashboard
      if (role === 'staff' || role === 'admin') {
        return NextResponse.next()
      }
      // Invalid role, redirect to select-user
      return NextResponse.redirect(new URL('/select-user', request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/select-user', request.url))
  }
}
