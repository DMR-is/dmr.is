import { SubscriberDto } from './gen/fetch'

declare module 'next-auth' {
  interface User extends DefaultUser, SubscriberDto {
    accessToken?: string
    refreshToken?: string
    idToken?: string
    nationalId?: string
  }

  interface Session {
    accessToken: string
    idToken: string
    scope?: string | string[]
    expires?: string
    user: User
    invalid?: boolean
    apiBasePath: string
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken: string
    refreshToken?: string
    idToken?: string
    nationalId?: string
    isActive?: boolean
    name?: string
    invalid?: boolean
    error?: string
  }
}
