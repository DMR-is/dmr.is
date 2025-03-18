import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const protectedRoutes = [
  '/',
  '/yfirflokkar',
  '/tegundir',
  '/ritstjorn',
  '/ritstjorn/:caseId',
  '/ritstjorn/:caseId/innsent',
  '/ritstjorn/:caseId/grunnvinnsla',
  '/ritstjorn/:caseId/yfirlestur',
  '/ritstjorn/:caseId/tilbuid',
  '/ritstjorn/:caseId/leidretting',
  '/utgafa',
  '/utgafa/stadfesting',
  '/heildaryfirlit',
  '/heildaryfirlit/:caseId',
]

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  if (!protectedRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/innskraning', req.url))
  }

  const isAdmin = token.user?.role.slug === 'ritstjori'

  if (!isAdmin && req.nextUrl.pathname === '/notendur') {
    return NextResponse.next() // Allow access to this page
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL('/notendur', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!.*\\.).*)',
}
