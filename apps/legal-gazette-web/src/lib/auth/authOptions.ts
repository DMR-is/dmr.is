import { AuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decode } from 'jsonwebtoken'

import { serverFetcher } from '@dmr.is/api-client/fetchers'
import { identityServerId } from '@dmr.is/auth/identityProvider'
import { identityServerConfig as sharedIdentityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { getLogger } from '@dmr.is/logging-next'

import { getLegalGazetteClient } from '../api/createClient'

const SESSION_TIMEOUT = 60 * 60 // 1 hour
const LOGGING_CATEGORY = 'next-auth'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

export const localIdentityServerConfig = {
  id: identityServerId,
  name: 'Iceland authentication service',
  scope: `openid offline_access profile`,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  clientId: process.env.LG_WEB_CLIENT_ID!,
  clientSecret: process.env.LG_WEB_CLIENT_SECRET ?? '',
}

export const identityServerConfig =
  process.env.NODE_ENV !== 'production'
    ? localIdentityServerConfig
    : {
        ...sharedIdentityServerConfig,
        scope: localIdentityServerConfig.scope,
      }

async function authorize(nationalId?: string, idToken?: string) {
  if (!idToken || !nationalId) {
    return null
  }

  const dmrClient = getLegalGazetteClient('UsersApi', idToken)

  try {
    const { data: member, error } = await serverFetcher(() =>
      dmrClient.getMyUser(),
    )
    if (!member) {
      const logger = getLogger('authorize')

      logger.error('Failure authenticating', {
        error: error,
        category: LOGGING_CATEGORY,
      })
      throw new Error('Member not found')
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
    maxAge: SESSION_TIMEOUT,
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


     return token
     // Refresh token is handled in middleware
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

        user.nationalId = nationalId
        user.name = authMember.name
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
        },
      },
    }),
  ],
}
