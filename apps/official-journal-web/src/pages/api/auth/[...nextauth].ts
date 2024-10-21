import { decode } from 'jsonwebtoken'
import NextAuth, { AuthOptions, User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import IdentityServer4 from 'next-auth/providers/identity-server4'
import { logger } from '@dmr.is/logging'
import { AdminUserRole } from '@dmr.is/shared/dto'

import { checkExpiry, refreshAccessToken } from '@island.is/next-ids-auth'

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

async function authorize(nationalId: string) {
  const dmrClient = createDmrClient()

  try {
    if (nationalId) {
      const member = await dmrClient.getUser({ nationalId })

      if (!member) {
        throw new Error('Member not found')
      }

      return member as User
    }

    return null
  } catch (e) {
    const error = e as ErrorWithPotentialReqRes

    if (error.request) {
      delete error.request
    }

    if (error.response) {
      delete error.response
    }

    logger.error('Failure authenticating', {
      error: error as Error,
      category: LOGGING_CATEGORY,
    })

    return null
  }
}

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
    jwt: async ({ token, user }) => {
      logger.info('jwt callback', user)
      if (user) {
        // On first sign-in, user will be available
        token.nationalId = user.nationalId
        token.displayName = user.displayName ?? 'unknown'
        token.roles = user.roles
        if (user.accessToken) {
          token.accessToken = user.accessToken
        }
        token.refreshToken = user.refreshToken
        token.idToken = user.idToken
        token.isRefreshTokenExpired = false
      }

      // Handle token expiry and refresh logic
      if (
        checkExpiry(
          token.accessToken as string,
          token.isRefreshTokenExpired as boolean,
        )
      ) {
        try {
          const [accessToken, refreshToken] = await refreshAccessToken(
            token.refreshToken as string,
            identityServerConfig.clientId,
            process.env.ISLAND_IS_DMR_WEB_CLIENT_SECRET,
            process.env.NEXTAUTH_URL,
            process.env.IDENTITY_SERVER_DOMAIN,
          )

          token.accessToken = accessToken
          token.refreshToken = refreshToken
        } catch (error: any) {
          logger.warn('Error refreshing access token.', error)
          const errorMessage = error?.response?.data?.error

          if (errorMessage === 'invalid_grant') {
            token.isRefreshTokenExpired = true
          }
        }
      }

      return token // Return the updated token object
    },
    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        roles: token.roles as AdminUserRole[],
        displayName: token.displayName as string,
        nationalId: token.nationalId,
      }

      // Add tokens to session
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string

      return session
    },
    signIn: async ({ user, account }) => {
      if (
        account?.provider === identityServerConfig.id &&
        account.access_token
      ) {
        const decodedAccessToken = decode(account.access_token) as JWT

        user.nationalId = decodedAccessToken?.nationalId as string
        user.accessToken = account?.access_token
        user.refreshToken = account?.refresh_token
        user.idToken = account?.id_token

        // Custom auth member from DB.
        const authMember = await authorize(user.nationalId)
        logger.info('authMember', authMember)

        if (!authMember) {
          return false
        }

        user.roles = authMember.roles
        user.displayName = authMember.displayName

        return true
      }

      return false
    },
  },
  providers: [
    IdentityServer4({
      id: identityServerConfig.id,
      name: identityServerConfig.name,
      clientId: identityServerConfig.clientId,
      clientSecret: process.env.ISLAND_IS_DMR_WEB_CLIENT_SECRET ?? '',
      issuer: process.env.IDENTITY_SERVER_DOMAIN,
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
