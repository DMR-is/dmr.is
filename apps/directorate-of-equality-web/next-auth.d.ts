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
    idToken: string
    scope?: string | string[]
    expires?: string
    user: User
    invalid?: boolean
    apiBasePath: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    refreshToken?: string
    idToken?: string
    nationalId?: string
    name?: string
    invalid?: boolean
    error?: string
  }
}
