import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('auth-token')?.value
  const isSuper = request.cookies.get('is_super')?.value === 'true'
  const { pathname } = request.nextUrl

  const loginURL = new URL('/', request.url)
  const dashboardURL = new URL('/dashboard', request.url)
  const adminURL = new URL('/admin', request.url)

  const pathPublico = pathname === '/' || pathname === '/registrar' || pathname === '/esqueci-minha-senha' || pathname === '/redefinir-senha'

  if (!token && !pathPublico) {
    return NextResponse.redirect(loginURL)
  }

  if (token && pathPublico) {
    
    if (isSuper) {
      return NextResponse.redirect(adminURL)
    } else {
      return NextResponse.redirect(dashboardURL)
    }
  }

  if (pathname.startsWith('/dashboard') && isSuper) {
    return NextResponse.redirect(adminURL)
  }

  if (pathname.startsWith('/admin') && !isSuper) {
    return NextResponse.redirect(dashboardURL)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/registrar',
    '/esqueci-minha-senha',
    '/redefinir-senha',
  ],
}
