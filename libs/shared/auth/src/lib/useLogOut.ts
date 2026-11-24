import { signIn } from 'next-auth/react'

import { identityServerId, signOutUrl } from './identityProvider'

// Blocked site storage makes the accessor throw; that must not stop a logout
const clearSessionStorage = () => {
  try {
    sessionStorage.clear()
  } catch {
    // Nothing to clear
  }
}

// A top-level POST rather than fetch: the server answers with a redirect to the
// identity server and the expired session cookies in the same response, so the
// id_token never reaches page JavaScript.
const submitLogoutForm = (action: string) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  document.body.appendChild(form)
  form.submit()
}

export const useLogOut = () => {
  const logOut = async () => {
    clearSessionStorage()

    // Revoke the refresh token while the session cookie is still present; the
    // logout response below expires it. next-auth's signOut() is not called
    // first: it deletes the session cookie, and the id_token needed for the
    // end-session request is read from it.
    await fetch('/api/auth/revoke-refresh', { method: 'POST' }).catch(
      () => undefined,
    )

    submitLogoutForm(signOutUrl(window))
  }
  return logOut
}

export const forceLogin = (callbackUrl: string) => {
  if (typeof window !== 'undefined') {
    clearSessionStorage()
  }
  signIn(identityServerId, { callbackUrl })
}
