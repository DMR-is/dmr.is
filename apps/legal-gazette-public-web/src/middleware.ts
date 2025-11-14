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
    signIn: '/',
    error: '/error',
  },
})

// This matcher applies the middleware to all routes except:
// - any route under "/api/"
// - any route that includes a dot in its path (such as static files like images, scripts, etc.)
// - the "/innskraning" (login) route
// In other words, authentication will be enforced on every page except for API requests, static assets, and the login page.
export const config = { matcher: ['/((?!api/.*|.*\\.|innskraning|$).*)'] }
