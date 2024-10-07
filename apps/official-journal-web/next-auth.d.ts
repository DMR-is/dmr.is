import { AdminUser } from '@dmr.is/shared/dto'

export declare module 'next-auth' {
  interface User extends AdminUser {}
  interface Session {
    user: User
    expires: string
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    user: User
  }
}
