import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decodeJwt } from 'jose'

import { identityServerId } from '@dmr.is/auth/identityProvider'
import { identityServerConfig as sharedIdentityServerConfig } from '@dmr.is/auth/identityServerConfig'

// This session timeout will be used to set the maxAge of the session cookie
// IDS has a max timeout on refresh tokens, so we set our session timeout to be slightly more
const SESSION_TIMEOUT = 60 * 60 * 8 + 30 // 8 hours and 30 seconds

export const localIdentityServerConfig = {
  id: identityServerId,
  name: 'Iceland authentication service',
  scope: `openid offline_access profile @logbirtingablad.is/lg-application-web`,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  clientId: process.env.LG_APPLICATION_WEB_CLIENT_ID!,
  clientSecret: process.env.LG_APPLICATION_WEB_CLIENT_SECRET ?? '',
}

export const identityServerConfig =
  process.env.NODE_ENV !== 'production'
    ? localIdentityServerConfig
    : {
        ...sharedIdentityServerConfig,
        scope: localIdentityServerConfig.scope,
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
        const decodedAccessToken = decodeJwt(account?.id_token) as JWT

        user.nationalId = decodedAccessToken.nationalId as string
        user.name = decodedAccessToken.name as string

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
