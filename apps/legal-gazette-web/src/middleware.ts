import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: async ({ token }) => {
      if (token && !token.invalid) {
        return true
      }
      return false
    },
  },
  pages: {
    signIn: '/innskraning',
    error: '/error',
  },
})

export const config = { matcher: ['/((?!api/.*|.*\\.|innskraning).*)'] }
