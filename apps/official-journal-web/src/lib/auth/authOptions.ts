import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decodeJwt } from 'jose'

import { identityServerConfig as sharedIdentityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { appAuthCookies } from '@dmr.is/auth/sessionCookies'
import { getLogger } from '@dmr.is/logging-next'

import { UserDto, UserRoleDto } from '../../gen/fetch'
import { getDmrClient } from '../api/createClient'
import { setLogoutHint } from './logoutHint'

// This session timeout will be used to set the maxAge of the session cookie
// IDS has a max timeout on refresh tokens, so we set our session timeout to be slightly more
const SESSION_TIMEOUT = 60 * 60 * 8 + 30 // 8 hours and 30 seconds
const LOGGING_CATEGORY = 'next-auth'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

// Statuses that mean "this person may not sign in", as opposed to an outage.
// 401 is a bad token, not a refusal, so it shows the generic error.
const REFUSED_STATUSES = [403, 404]

class SignInRefused extends Error {}

// The API client throws node-fetch's Response, so check the shape, not the class
const httpStatus = (e: unknown) =>
  typeof e === 'object' &&
  e !== null &&
  typeof (e as { status?: unknown }).status === 'number'
    ? (e as { status: number }).status
    : undefined

// Thrown from signIn for failures that aren't a refusal. NextAuth then shows
// /error with the generic message and leaves the island.is session alone.
const SIGN_IN_FAILED = 'SignInFailed'

export const localIdentityServerConfig = sharedIdentityServerConfig

// Own cookie names, so apps sharing a host can't overwrite each other's session
export const AUTH_COOKIE_PREFIX = 'oj-web'

export const identityServerConfig =
  process.env.NODE_ENV !== 'production'
    ? localIdentityServerConfig
    : {
        ...sharedIdentityServerConfig,
        scope: localIdentityServerConfig.scope,
      }

// Returns null only when the person is refused; throws on any other failure
export async function authorize(nationalId?: string, idToken?: string) {
  if (!idToken || !nationalId) {
    throw new Error(SIGN_IN_FAILED)
  }

  const dmrClient = getDmrClient(idToken)

  try {
    const { user: member } = await dmrClient.getUserByNationalId({
      nationalId,
    })

    if (!member) {
      throw new SignInRefused('Member not found')
    }
    const role = member?.role
    const isAdmin = role?.slug === 'ritstjori'

    if (!isAdmin) {
      throw new SignInRefused('User is not an admin')
    }

    return member as UserDto
  } catch (e) {
    // The generated client throws the Response itself on a non-2xx status
    const status = httpStatus(e)
    const refused =
      e instanceof SignInRefused ||
      (status !== undefined && REFUSED_STATUSES.includes(status))
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

    if (refused) {
      return null
    }
    throw new Error(SIGN_IN_FAILED)
  }
}

export const authOptions: AuthOptions = {
  cookies: appAuthCookies(AUTH_COOKIE_PREFIX),
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
        if (!account?.id_token) {
          throw new Error(SIGN_IN_FAILED)
        }
        const decodedAccessToken = decodeJwt(account?.id_token) as JWT
        const nationalId = decodedAccessToken?.nationalId
        const authMember = await authorize(nationalId, account?.id_token)
        if (!authMember) {
          // End the IDS session so the next login can pick another person
          await setLogoutHint(account.id_token)

          return '/api/auth/access-denied'
        }
        // Mutate user object to include roles, nationalId and displayName
        user.role = authMember.role
        user.nationalId = nationalId
        user.displayName = authMember.displayName
        user.id = authMember.id
        return true
      }

      throw new Error(SIGN_IN_FAILED)
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
