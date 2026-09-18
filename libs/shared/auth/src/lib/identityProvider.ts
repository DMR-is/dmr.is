export const identityServerId = 'identity-server'

export const signOutUrl = (window: Window) =>
  `${window.location.origin}/api/auth/logout`
