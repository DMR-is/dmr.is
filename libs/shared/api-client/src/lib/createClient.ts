import { createEnhancedFetch } from './createEnhancedFetch'

type WebClient = 'LGAdmin' | 'OJOIAdmin' | 'LGWeb'

const getPath = (client: WebClient) => {
  if (process.env.NODE_ENV !== 'production') {
    const port = client === 'OJOIAdmin' ? 4000 : 4100
    return `http://localhost:${port}`
  }

  if (typeof window === 'undefined') {
    return process.env.DMR_ADMIN_API_BASE_PATH as string
  }

  const host = window.location.host.split('.')
  if (client === 'OJOIAdmin') {
    // Removing first part of the domain (ritstjorn) and adding admin-api of OJOI
    // Example: https://ritstjorn.example.com -> https://admin-api.example.com
    host.shift()
    host.unshift('admin-api')
  } else {
    // Not removing first part of domain for LG, and adding api.internal for LG
    // Example: https://example.com -> https://api.internal.example.com
    host.unshift('api.internal')
  }
  return `https://${host.join('.')}`
}

type CParameters = {
  fetchApi: (url: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  accessToken: string
  basePath: string
}

export const config = <Configuration>(
  Configuration: new (config?: CParameters) => Configuration,
  token: string,
  client: WebClient,
  ) => {
  const fetchWithCookie = createEnhancedFetch()

  return new Configuration({
    fetchApi: async (url: RequestInfo | URL, init: RequestInit = {}) => {
      const finalUrl =
        typeof url === 'string' || url instanceof URL ? url.toString() : url

      return fetchWithCookie(finalUrl, init)
    },
    accessToken: token,
    basePath: getPath(client),
  })
}

let dmrClient: {
  client: unknown
  token: string
}

export const getDmrClient = <DefaultApi, Configuration>(
  DefaultApi: new (config: Configuration) => DefaultApi,
  Configuration: new (config?: CParameters) => Configuration,
  token: string,
  client: WebClient = 'OJOIAdmin',
): DefaultApi => {
  if (typeof window === 'undefined') {
    return new DefaultApi(config(Configuration, token, client))
  }
  if (dmrClient && dmrClient.token === token) {
    return dmrClient.client as DefaultApi
  }
  dmrClient = {
    client: new DefaultApi(config(Configuration, token, client)),
    token,
  }

  return dmrClient.client as DefaultApi
}
