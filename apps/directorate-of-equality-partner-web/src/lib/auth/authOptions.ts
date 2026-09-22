import type { AuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import IdentityServer4 from 'next-auth/providers/identity-server4'

import { decodeJwt } from 'jose'

import { type DecodedIdToken, isCompanySubject } from './companySubject'
import { identityServerConfig } from './identityServerConfig'
import { setLogoutHint } from './logoutHint'

const SESSION_TIMEOUT = 60 * 60 * 8 + 30

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
          companyNationalId: user.companyNationalId,
          actor: user.actor,
          name: user.name ?? 'unknown',
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
        } as JWT
      }

      return token
    },

    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        name: token.name as string,
        companyNationalId: token.companyNationalId,
        actor: token.actor,
      }

      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string

      if (token.invalid) {
        session.invalid = true
      }

      return session
    },
    // Unlike directorate-of-equality-web, this app has no allowlist: any
    // company that authenticates through IDS belongs here, so there is no
    // getMyUser call and no authorize() helper. The only gates are "did IDS
    // hand us an id token" and "is its subject a company" -- see
    // isCompanySubject in ./companySubject for why the nationalId claim
    // alone cannot answer the second.
    // A refusal still has to end the upstream IDS session (see
    // access-denied/route.ts) or a retry silently SSOs the same token back
    // in and loops.
    signIn: async ({ user, account }) => {
      if (
        account?.provider === identityServerConfig.id &&
        account.access_token
      ) {
        if (!account?.id_token) {
          return false
        }

        const decodedIdToken = decodeJwt(account.id_token) as DecodedIdToken
        const companyNationalId = decodedIdToken.nationalId

        if (!isCompanySubject(decodedIdToken)) {
          await setLogoutHint(account.id_token)

          return '/api/auth/access-denied'
        }

        user.companyNationalId = companyNationalId
        user.actor = decodedIdToken.actor

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
