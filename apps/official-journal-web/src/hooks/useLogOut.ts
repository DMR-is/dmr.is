import { signIn, signOut, useSession } from 'next-auth/react'
import { identityServerId, signOutUrl } from '@dmr.is/auth'

export const useLogOut = () => {
  const { data: session } = useSession()

  const logOut = () => {
    sessionStorage.clear()

    signOut({
      callbackUrl: signOutUrl(window, session?.idToken as string),
    })
  }
  return logOut
}

export const forceLogin = (callbackUrl: string) => {
  sessionStorage.clear()
  signIn(identityServerId, { callbackUrl })
}
