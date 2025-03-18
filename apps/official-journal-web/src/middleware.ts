import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { Routes } from './lib/constants'

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  const {
    Login: _login,
    UserManagement: _userManagement,
    ...protectedRouteObj
  } = Routes

  const protectedRoutes: string[] = Array.from(Object.values(protectedRouteObj))

  if (!protectedRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL(Routes.Login, req.url))
  }

  const isAdmin = token.user?.role.slug === 'ritstjori'

  if (!isAdmin && req.nextUrl.pathname === Routes.UserManagement) {
    return NextResponse.next() // Allow access to this page
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL(Routes.UserManagement, req.url))
  }

  return NextResponse.next()
}

export const config = { matcher: '/((?!.*\\.).*)' }
