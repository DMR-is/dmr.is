export const identityServerId = 'identity-server'

export const signOutUrl = (window: Window, idToken: string) =>
  `${window.location.origin}/api/auth/logout?id_token=${idToken}`

export const identityServerConfig = {
  id: identityServerId,
  name: 'Iceland authentication service',
  scope: `openid profile @skra.is/individuals`,
  clientId: '@dmr.is/ojoi/web',
}