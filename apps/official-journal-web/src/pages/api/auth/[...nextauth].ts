import { decode } from 'jsonwebtoken'
import NextAuth, { AuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'
import { identityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { isExpired, refreshAccessToken } from '@dmr.is/auth/token-service'
import { logger } from '@dmr.is/logging'

import { UserDto, UserRoleDto } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

const NODE_ENV = process.env.NODE_ENV
const SESION_TIMEOUT = 60 * 60 // 1 hour

const secure = NODE_ENV === 'production' ? '__Secure-' : ''

const LOGGING_CATEGORY = 'next-auth'

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
          role: user.role,
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
        const decodedAccessToken = decode(account?.id_token) as JWT
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

export default NextAuth(authOptions)
