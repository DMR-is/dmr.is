import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decodeJwt } from 'jose'

import { getLogger } from '@dmr.is/logging-next'

import { getMyUser } from '../../gen/fetch/sdk.gen'
import { getDoEClient } from '../api/createClient'
import { identityServerConfig } from './identityServerConfig'
import { setLogoutHint } from './logoutHint'

const SESSION_TIMEOUT = 60 * 60 * 8 + 30
const LOGGING_CATEGORY = 'next-auth'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

async function authorize(nationalId?: string, idToken?: string) {
  if (!idToken || !nationalId) {
    return null
  }

  const dmrClient = getDoEClient(idToken)

  try {
    const { data: member, error } = await getMyUser({ client: dmrClient })
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
          role: user.role,
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
        role: token.role as 'ADMIN' | 'EDITOR',
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
          // The id_token travels in an HttpOnly cookie rather than the query string:
          // sign-in is refused before a session exists, so there is nothing for the
          // route to read, and a query parameter would land in our access logs and
          // the browser history.
          await setLogoutHint(account.id_token)

          return '/api/auth/access-denied'
        }

        user.nationalId = nationalId
        user.name = `${authMember.firstName} ${authMember.lastName}`
        user.id = authMember.id
        user.role = authMember.role
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
