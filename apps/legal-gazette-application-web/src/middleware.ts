import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  if (req.nextUrl.pathname === '/innskraning' && !token) {
    return NextResponse.next()
  }

  const isProtectedRoute = '/innskraning' !== req.nextUrl.pathname
  if (isProtectedRoute && !token) {
    const callbackUrl = req.nextUrl.pathname
    const isRelativeUrl = callbackUrl && callbackUrl.startsWith('/')
    let fullUrl = `/innskraning`

    if (callbackUrl && isRelativeUrl && callbackUrl !== ('/' || '/error')) {
      fullUrl = `/innskraning?callbackUrl=${callbackUrl}`
    }

    return NextResponse.redirect(new URL(fullUrl, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api/.*|.*\\.).*)',
}
