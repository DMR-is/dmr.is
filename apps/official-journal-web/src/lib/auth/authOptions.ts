import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decodeJwt } from 'jose'

import { identityServerConfig as sharedIdentityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { getLogger } from '@dmr.is/logging-next'

import { UserDto, UserRoleDto } from '../../gen/fetch'
import { getDmrClient } from '../api/createClient'

// This session timeout will be used to set the maxAge of the session cookie
// IDS has a max timeout on refresh tokens, so we set our session timeout to be slightly more
const SESSION_TIMEOUT = 60 * 60 * 8 + 30 // 8 hours and 30 seconds
const LOGGING_CATEGORY = 'next-auth'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

export const localIdentityServerConfig = sharedIdentityServerConfig

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

  const dmrClient = getDmrClient(idToken)

  try {
    const { user: member } = await dmrClient.getUserByNationalId({
      nationalId,
    })

    if (!member) {
      throw new Error('Member not found')
    }

    return member as UserDto
  } catch (e) {
    const error = e as ErrorWithPotentialReqRes

    if (error.request) {
      delete error.request
    }

    if (error.response) {
      delete error.response
    }

    const logger = getLogger('authorize')
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
        // On first sign-in, user will be available
        return {
          ...token,
          nationalId: user.nationalId,
          displayName: user.displayName ?? 'unknown',
          role: user.role,
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
        role: token.role as UserRoleDto,
        displayName: token.displayName as string,
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
        const decodedAccessToken = decodeJwt(account?.id_token) as JWT
        const nationalId = decodedAccessToken?.nationalId
        const authMember = await authorize(nationalId, account?.id_token)
        // Return false if no user is found
        if (!authMember) {
          return false
        }
        // Mutate user object to include roles, nationalId and displayName
        user.role = authMember.role
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
