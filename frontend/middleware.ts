import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = 
    path === '/' ||
    path === '/login' ||
    path === '/register' ||
    path === '/about' ||
    path === '/contact' ||
    path === '/properties' ||
    path.startsWith('/properties/') ||
    path === '/valuation' ||
    path === '/market'
  
  const token = request.cookies.get('access_token')?.value

  // Redirect authenticated users away from auth pages
  if ((path === '/login' || path === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard routes
  if (path.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect admin routes
  if (path.startsWith('/admin') && token) {
    // You can add admin role check here
    const userCookie = request.cookies.get('user')
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        if (user.user_type !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/admin/:path*',
  ],
}