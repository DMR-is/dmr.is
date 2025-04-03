import { identityServerId } from "./identityProvider";

export const identityServerConfig = {
  id: identityServerId,
  name: 'Iceland authentication service',
  scope: `openid offline_access profile`,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  clientId: process.env.ISLAND_IS_DMR_WEB_CLIENT_ID!,
  clientSecret: process.env.ISLAND_IS_DMR_WEB_CLIENT_SECRET ?? '',
}
