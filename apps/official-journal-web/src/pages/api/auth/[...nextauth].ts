import NextAuth, { AuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import IdentityServer4 from 'next-auth/providers/identity-server4'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../lib/api/createClient'
import { identityServerConfig } from '../../../lib/identityProvider'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

const NODE_ENV = process.env.NODE_ENV
const SESION_TIMEOUT = 30 * 60 // 30 min

const secure = NODE_ENV === 'production' ? '__Secure-' : ''

const LOGGING_CATEGORY = 'next-auth'

import {
  AuthSession,
  AuthUser,
  jwt as handleJwt,
  session as handleSession,
  signIn as handleSignIn,
} from '@island.is/next-ids-auth'

export const authOptions: AuthOptions = {
  pages: {
    signIn: '/innskraning',
    error: '/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESION_TIMEOUT,
  },
  jwt: {
    maxAge: SESION_TIMEOUT,
  },
  cookies: {
    sessionToken: {
      name: `${secure}next-auth.session-token`,

      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !!secure,
      },
    },
    callbackUrl: {
      name: `${secure}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: !!secure,
      },
    },
    csrfToken: {
      name: `${secure}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !!secure,
      },
    },
  },
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: token.user,
      }
    },
    jwt: ({ token, user }) => {
      if (user) {
        return {
          ...token,
          user,
        }
      }
      return token
    },
  },
  providers: [
    IdentityServer4({
      id: identityServerConfig.id,
      name: identityServerConfig.name,
      clientId: identityServerConfig.clientId,
      clientSecret: process.env.IDENTITY_SERVER_SECRET ?? '',
      authorization: {
        params: {
          scope: `${identityServerConfig.scope}`,
          domain: process.env.IDENTITY_SERVER_DOMAIN ?? '',
          protection: 'pkce',
        },
      },
    }),
    CredentialsProvider({
      id: 'kennitala',
      name: 'kennitala',
      credentials: {
        nationalId: { type: 'text' },
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async authorize(credentials, req) {
        const dmrClient = createDmrClient()

        try {
          if (credentials?.nationalId) {
            const member = await dmrClient.getUser({
              nationalId: credentials.nationalId,
            })

            if (!member) {
              throw new Error('Member not found')
            }

            return member as User
          }

          return null
        } catch (e) {
          e as ErrorWithPotentialReqRes
          if ((e as ErrorWithPotentialReqRes).request) {
            delete (e as ErrorWithPotentialReqRes).request
          }

          if ((e as ErrorWithPotentialReqRes).response) {
            delete (e as ErrorWithPotentialReqRes).response
          }
          logger.error('Failure authenticating', {
            error: e as Error,
            category: LOGGING_CATEGORY,
          })
        }
        // Return null if user data could not be retrieved
        return null
      },
    }),
  ],
}

export default NextAuth(authOptions)
