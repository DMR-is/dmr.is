import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/innskraning',
    error: '/error',
  },
})

export const config = { matcher: ['/((?!api/.*|.*\\.|innskraning).*)'] }
