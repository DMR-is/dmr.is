export const identityServerId = 'identity-server'

export const signOutUrl = (window: Window, idToken: string) =>
  `${window.location.origin}/api/auth/logout?id_token=${idToken}`

export const identityServerConfig = {
  id: identityServerId,
  name: 'Iceland authentication service',
  scope: `openid offline_access profile @skra.is/individuals`,
  clientId: process.env.ISLAND_IS_DMR_WEB_CLIENT_ID,
}
