import { signIn, signOut } from 'next-auth/react'

import { identityServerId, signOutUrl } from '@dmr.is/auth/identityProvider'

export const useLogOut = () => {
  const logOut = async () => {
    sessionStorage.clear()

    const endSession = await fetch(signOutUrl(window), { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)

    await signOut({ redirect: false })

    window.location.assign(endSession?.url ?? window.location.origin)
  }
  return logOut
}

export const forceLogin = (callbackUrl: string) => {
  sessionStorage.clear()
  signIn(identityServerId, { callbackUrl })
}
