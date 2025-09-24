import { AuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decode } from 'jsonwebtoken'

import { serverFetcher } from '@dmr.is/api-client/fetchers'
import { identityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { isExpired, refreshAccessToken } from '@dmr.is/auth/token-service'
import { getLogger } from '@dmr.is/logging'

import { getClient } from './createClient'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

const SESION_TIMEOUT = 60 * 60 // 1 hour

const LOGGING_CATEGORY = 'next-auth'

async function authorize(nationalId?: string, idToken?: string) {
  if (!idToken || !nationalId) {
    return null
  }

  const dmrClient = getClient(idToken)

  try {
    const { data: member, error } = await serverFetcher(() =>
      dmrClient.getMySubscriber(),
    )
    if (!member) {
      const logger = getLogger('authorize')

      logger.error('Failure authenticating', {
        error: error,
        category: LOGGING_CATEGORY,
      })
      throw new Error('Member not found')
    }

    if (!member.isActive) {
      const logger = getLogger('authorize')
      logger.error('Subscriber is not active', {
        nationalId,
        category: LOGGING_CATEGORY,
      })
      throw new Error('Subscriber is not active')
    }

    return member
  } catch (e) {
    const error = e as ErrorWithPotentialReqRes

    if (error.request) {
      delete error.request
    }

    if (error.response) {
      delete error.response
    }

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
          name: user.name ?? 'unknown',
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          userId: user.id,
          idToken: account.id_token,
        } as JWT
      }

      if (!isExpired(token.accessToken, !!token.invalid)) {
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
        name: token.name as string,
        nationalId: token.nationalId,
        id: token.userId as string,
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
        // Return false if no id_token is found
        if (!account?.id_token) {
          return false
        }
        const decodedAccessToken = decode(account?.id_token) as JWT
        const nationalId = decodedAccessToken?.nationalId
        const authMember = await authorize(nationalId, account?.id_token)
        // Return false if no user is found
        if (!authMember) {
          return false
        }
        // Mutate user object to include roles, nationalId and displayName
        user.nationalId = authMember.nationalId
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
      clientSecret: identityServerConfig.clientSecret,
      issuer: `https://${process.env.IDENTITY_SERVER_DOMAIN}`,
      authorization: {
        params: {
          scope: `${identityServerConfig.scope}`,
          domain: `https://${process.env.IDENTITY_SERVER_DOMAIN}`,
          protection: 'pkce',
          prompt: 'select_account',
        },
      },
    }),
  ],
}
