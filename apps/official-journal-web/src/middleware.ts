import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const protectedRoutes = [
  '/',
  '/yfirflokkar',
  '/tegundir',
  '/ritstjorn',
  '/utgafa',
  '/heildaryfirlit',
]

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  if (req.nextUrl.pathname === '/innskraning' && !token) {
    return NextResponse.next()
  }

  const isProtectedRoute = protectedRoutes.includes(req.nextUrl.pathname)
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const isAdmin = token?.role?.slug === 'ritstjori'

  if (!isAdmin && req.nextUrl.pathname === '/notendur') {
    return NextResponse.next()
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL('/notendur', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api/.*|.*\\.).*)',
}
