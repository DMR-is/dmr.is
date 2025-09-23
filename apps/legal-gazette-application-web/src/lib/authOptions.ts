import { AuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decode } from 'jsonwebtoken'

import { identityServerConfig } from '@dmr.is/auth/identityServerConfig'
import { isExpired, refreshAccessToken } from '@dmr.is/auth/token-service'
import { getLogger } from '@dmr.is/logging'

const SESION_TIMEOUT = 60 * 60 // 1 hour

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
          nationalId: account.nationalId,
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

        user.nationalId = decodedAccessToken.nationalId as string
        user.name = decodedAccessToken.name as string

        return true
      }

      return false
    },
  },
  providers: [
    IdentityServer4(
      (() => {
        const logger = getLogger('AuthOptions')

        logger.info('Setting up IdentityServer4 provider', {
          redirect_uri: `${process.env.IDENTITY_SERVER_LOGOUT_URL}/api/auth/callback/identity-server`,
        })

        return {
          id: identityServerConfig.id,
          name: identityServerConfig.name,
          clientId: identityServerConfig.clientId,
          clientSecret: identityServerConfig.clientSecret,
          issuer: `https://${process.env.IDENTITY_SERVER_DOMAIN}`,
          authorization: {
            params: {
              redirect_uri: `${process.env.IDENTITY_SERVER_LOGOUT_URL}/api/auth/callback/identity-server`,
              scope: `${identityServerConfig.scope}`,
              domain: `https://${process.env.IDENTITY_SERVER_DOMAIN}`,
              protection: 'pkce',
              prompt: 'select_account',
            },
          },
        }
      })(),
    ),
  ],
}
