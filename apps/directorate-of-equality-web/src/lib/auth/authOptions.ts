import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decodeJwt } from 'jose'

import { serverFetcher } from '@dmr.is/api-client/fetchers'
import { identityServerId } from '@dmr.is/auth/identityProvider'
import { identityServerConfig as sharedIdentityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { getLogger } from '@dmr.is/logging-next'

import { getDoEClient } from '../api/createClient'

const SESSION_TIMEOUT = 60 * 60 * 8 + 30
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
  clientId: process.env.DOE_WEB_CLIENT_ID!,
  clientSecret: process.env.DOE_WEB_CLIENT_SECRET ?? '',
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

  const dmrClient = getDoEClient(idToken)

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
  jwt: {
    maxAge: SESSION_TIMEOUT,
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_TIMEOUT,
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user && account) {
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
    },

    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        name: token.name as string,
        nationalId: token.nationalId,
        id: token.userId as string,
      }

      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string

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
        if (!account?.id_token) {
          return false
        }
        const decodedAccessToken = decodeJwt(account?.id_token) as JWT
        const nationalId = decodedAccessToken?.nationalId
        const authMember = await authorize(nationalId, account?.id_token)
        if (!authMember) {
          // IDS authenticated but user is not registered in our system (getMyUser non-200).
          // Terminate the IDS upstream session and wipe any NextAuth flow cookies.
          return `/api/auth/access-denied?id_token=${account.id_token}`
        }

        user.nationalId = nationalId
        user.name = `${authMember.firstName} ${authMember.lastName}`
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
