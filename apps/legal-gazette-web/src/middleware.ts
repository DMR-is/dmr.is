import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { Route } from './lib/constants'
import { getLoginRedirectUrl } from './lib/utils'

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  if (req.nextUrl.pathname === '/innskraning' && !token) {
    return NextResponse.next()
  }

  const isProtectedRoute = Route.LOGIN !== req.nextUrl.pathname
  if (isProtectedRoute && !token) {
    const fullUrl = getLoginRedirectUrl(req.nextUrl.pathname)
    return NextResponse.redirect(new URL(fullUrl, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api/.*|.*\\.).*)',
}
