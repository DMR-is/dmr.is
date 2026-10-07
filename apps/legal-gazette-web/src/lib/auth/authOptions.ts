import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decodeJwt } from 'jose'

import { serverFetcher } from '@dmr.is/api-client/fetchers'
import { identityServerConfig as sharedIdentityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { appAuthCookies } from '@dmr.is/auth/sessionCookies'
import { getLogger } from '@dmr.is/logging-next'

import { getLegalGazetteClient } from '../api/createClient'
import { setLogoutHint } from './logoutHint'

// This session timeout will be used to set the maxAge of the session cookie
// When refreshing the token, we will not update the maxAge, so the session will expire
const SESSION_TIMEOUT = 60 * 60 * 8 + 30 // 8 hours and 30 seconds
const LOGGING_CATEGORY = 'next-auth'

type ErrorWithPotentialReqRes = Error & {
  request?: unknown
  response?: unknown
}

// Local and deployed environments now use the same variable names. The previous
// LG_WEB_CLIENT_ID / LG_WEB_CLIENT_SECRET pair existed only because every app
// shared one shell: three web apps could not each hold their own
// ISLAND_IS_DMR_WEB_CLIENT_ID, so local dev used per-app names and switched back
// to the shared ones in production. Configuration now resolves per app, in that
// app's own process, so the workaround and the NODE_ENV branch are unnecessary.
// Own cookie names, so apps sharing a host can't overwrite each other's session
export const AUTH_COOKIE_PREFIX = 'lg-web'

export const identityServerConfig = {
  ...sharedIdentityServerConfig,
  scope: `openid offline_access profile`,
}

// Statuses that mean "this person may not sign in", as opposed to an outage
const REFUSED_STATUSES = [401, 403, 404]

class SignInRefused extends Error {}

// Thrown from signIn for failures that aren't a refusal. NextAuth then shows
// /error with the generic message and leaves the island.is session alone.
const SIGN_IN_FAILED = 'SignInFailed'

// Returns null only when the person is refused; throws on any other failure
async function authorize(nationalId?: string, idToken?: string) {
  if (!idToken || !nationalId) {
    throw new Error(SIGN_IN_FAILED)
  }

  const dmrClient = getLegalGazetteClient(idToken)

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
      if (error && REFUSED_STATUSES.includes(error.statusCode)) {
        throw new SignInRefused('Member not found')
      }
      throw new Error(SIGN_IN_FAILED)
    }

    return member
  } catch (e) {
    const refused = e instanceof SignInRefused
    const error = e as ErrorWithPotentialReqRes

    if (error.request) {
      delete error.request
    }

    if (error.response) {
      delete error.response
    }

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

        user.nationalId = nationalId
        user.name = authMember.name
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
