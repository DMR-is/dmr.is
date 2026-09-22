import { DefaultUser } from 'next-auth'

// The acting human under a procuration (company) login. See
// src/lib/auth/authOptions.ts for where this is read off the id token.
export interface SessionActor {
  nationalId: string
  name: string
  scope: Array<string>
}

declare module 'next-auth' {
  interface User extends DefaultUser {
    accessToken?: string
    refreshToken?: string
    idToken?: string
    // The company being acted for, not the signed-in human.
    companyNationalId?: string
    actor?: SessionActor
  }

  interface Session {
    accessToken: string
    idToken: string
    user: User
    invalid?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    refreshToken?: string
    idToken?: string
    name?: string
    companyNationalId?: string
    actor?: SessionActor
    invalid?: boolean
    error?: string
  }
}
