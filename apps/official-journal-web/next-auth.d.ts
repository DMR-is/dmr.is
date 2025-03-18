import { UserDto } from './src/gen/fetch'

declare module 'next-auth' {
  interface User extends DefaultUser, UserDto {
    accessToken?: string
    refreshToken?: string
    idToken?: string
    nationalId?: string
  }

  interface Session {
    accessToken: string
    idToken?: string
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
    name?: string
    email?: string
    invalid?: boolean
    error?: string
    user?: UserDto
  }
}
