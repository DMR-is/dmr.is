import { createEnhancedFetch } from './createEnhancedFetch'

const getPath = () => {
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000'
  }

  if (typeof window === 'undefined') {
    return process.env.DMR_ADMIN_API_BASE_PATH as string
  }
  // Removing first part of the domain (ritstjorn) and adding admin-api
  const host = window.location.host.split('.')
  host.shift()
  host.unshift('admin-api')
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
) => {
  const fetchWithCookie = createEnhancedFetch()

  return new Configuration({
    fetchApi: async (url: RequestInfo | URL, init: RequestInit = {}) => {
      const finalUrl =
        typeof url === 'string' || url instanceof URL ? url.toString() : url

      return fetchWithCookie(finalUrl, init)
    },
    accessToken: token,
    basePath: getPath(),
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
): DefaultApi => {
  if (typeof window === 'undefined') {
    return new DefaultApi(config(Configuration, token))
  }
  if (dmrClient && dmrClient.token === token) {
    return dmrClient.client as DefaultApi
  }
  dmrClient = {
    client: new DefaultApi(config(Configuration, token)),
    token,
  }

  return dmrClient.client as DefaultApi
}
