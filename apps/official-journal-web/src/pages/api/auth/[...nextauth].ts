import { decode } from 'jsonwebtoken'
import NextAuth, { AuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'
import { logger } from '@dmr.is/logging'
import { AdminUser, AdminUserRole } from '@dmr.is/shared/dto'

import { getDmrClient } from '../../../lib/api/createClient'
import { identityServerConfig } from '../../../lib/identityProvider'
import { refreshAccessToken } from '../../../lib/token-service'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

const NODE_ENV = process.env.NODE_ENV
const SESION_TIMEOUT = 60 * 60 // 1 hour

const secure = NODE_ENV === 'production' ? '__Secure-' : ''

const LOGGING_CATEGORY = 'next-auth'

async function authorize(nationalId?: string, accessToken?: string) {
  if (!accessToken || !nationalId) {
    return null
  }

  const dmrClient = getDmrClient(accessToken)

  try {
    const { user: member } = await dmrClient.getUserByNationalId({
      nationalId,
    })

    if (!member) {
      throw new Error('Member not found')
    }

    return member as AdminUser
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
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user && account) {
        // On first sign-in, user will be available
        return {
          ...token,
          nationalId: user.nationalId,
          displayName: user.displayName ?? 'unknown',
          roles: user.roles,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : 0,
          refreshToken: account.refresh_token,
          adminUserId: user.id,
          idToken: account.id_token,
        } as JWT
      }

      // Check if token expires in more than 10 seconds
      const date10SecondsAgo = Date.now() - 10000
      if (date10SecondsAgo < (token.accessTokenExpires as number)) {
        return token
      }

      // If token is expired, try to refresh it
      // Returning new access, refresh and id tokens
      // On failure, return token.invalid = true
      return refreshAccessToken(token)
    },

    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        roles: token.roles as AdminUserRole[],
        displayName: token.displayName as string,
        nationalId: token.nationalId,
        id: token.adminUserId as string,
      }

      // Add tokens to session
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string

      // If token is invalid, set invalid flag to session
      if (token.invalid) {
        session.invalid = true
      }

      return session
    },
    signIn: async ({ user, account }) => {
      if (
        account?.provider === identityServerConfig.id &&
        account.access_token
      ) {
        const decodedAccessToken = decode(account.access_token) as JWT
        const nationalId = decodedAccessToken?.nationalId
        const authMember = await authorize(nationalId, account.access_token)
        // Return false if no user is found
        if (!authMember) {
          return false
        }
        // Mutate user object to include roles, nationalId and displayName
        user.roles = authMember.roles
        user.nationalId = nationalId
        user.displayName = authMember.displayName
        user.id = authMember.id
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
      issuer: `https://${process.env.IDENTITY_SERVER_DOMAIN}`,
      authorization: {
        params: {
          scope: `${identityServerConfig.scope}`,
          domain: `https://${process.env.IDENTITY_SERVER_DOMAIN}`,
          protection: 'pkce',
        },
      },
    }),
  ],
}

export default NextAuth(authOptions)
