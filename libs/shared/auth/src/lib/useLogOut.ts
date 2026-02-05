import { signIn, signOut, useSession } from 'next-auth/react'

import { identityServerId, signOutUrl } from './identityProvider'

export const useLogOut = () => {
  const { data: session } = useSession()

  const logOut = () => {
    if (typeof window !== 'undefined') {
      sessionStorage?.clear()
    }

    signOut({
      callbackUrl: signOutUrl(window, session?.idToken as string),
    })
  }
  return logOut
}

export const forceLogin = (callbackUrl: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage?.clear()
  }
  signIn(identityServerId, { callbackUrl })
}
