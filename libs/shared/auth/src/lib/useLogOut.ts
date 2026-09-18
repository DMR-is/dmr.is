import { signIn, signOut } from 'next-auth/react'

import { identityServerId, signOutUrl } from './identityProvider'

export const useLogOut = () => {
  const logOut = async () => {
    // Revoke the refresh token and read the end-session URL while the session
    // cookie is still present; signOut() below deletes it.
    await fetch('/api/auth/revoke-refresh', { method: 'POST' }).catch(
      () => undefined,
    )

    const endSession = await fetch(signOutUrl(window), { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)

    await signOut({ redirect: false })

    window.location.assign(endSession?.url ?? window.location.origin)
  }
  return logOut
}

export const forceLogin = (callbackUrl: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage?.clear()
  }
  signIn(identityServerId, { callbackUrl })
}
