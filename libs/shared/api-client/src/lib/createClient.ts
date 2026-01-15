import { createUrlFromHost } from '@dmr.is/utils/client'

import { createEnhancedFetch } from './createEnhancedFetch'

type WebClient =
  | 'LGAdmin'
  | 'OJOIAdmin'
  | 'LGWeb'
  | 'LGApplicationWeb'
  | 'LGPublicWeb'

const getPath = (client: WebClient) => {
  if (process.env.NODE_ENV !== 'production') {
    const port = client === 'OJOIAdmin' ? 4000 : 4100
    return `http://localhost:${port}`
  }

  if (typeof window === 'undefined') {
    return process.env.DMR_ADMIN_API_BASE_PATH as string
  }
  const url = createUrlFromHost(
    window.location.host,
    client === 'OJOIAdmin',
    client === 'OJOIAdmin' ? 'admin-api' : 'api.internal',
  )
  return url
}

type CParameters = {
  fetchApi: (url: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  accessToken: string | (() => string)
  idToken?: string
  basePath: string
}

const getAccessToken = (tokens: string | Array<string>) => {
  if (Array.isArray(tokens)) {
    if (tokens.length === 1) {
      return tokens[0]
    }
    return tokens
      .map((t, i) => {
        if (i === 0) {
          return t
        }
        return `, Bearer ${t}`
      })
      .join('')
  }
  return tokens
}

export const config = <Configuration>(
  Configuration: new (config?: CParameters) => Configuration,
  token: string | Array<string>,
  client: WebClient,
) => {
  const fetchWithCookie = createEnhancedFetch()

  return new Configuration({
    fetchApi: async (url: RequestInfo | URL, init: RequestInit = {}) => {
      const finalUrl =
        typeof url === 'string' || url instanceof URL ? url.toString() : url

      return fetchWithCookie(finalUrl, init)
    },
    accessToken: getAccessToken(token),
    basePath: getPath(client),
  })
}

let dmrClient: {
  client: unknown
  token: string | Array<string>
}

export const getDmrClient = <DefaultApi, Configuration>(
  DefaultApi: new (config: Configuration) => DefaultApi,
  Configuration: new (config?: CParameters) => Configuration,
  token: string | Array<string>,
  client: WebClient = 'OJOIAdmin',
): DefaultApi => {
  const tokenString = getAccessToken(token)
  if (typeof window === 'undefined') {
    return new DefaultApi(config(Configuration, tokenString, client))
  }
  if (dmrClient && dmrClient.token === tokenString) {
    return dmrClient.client as DefaultApi
  }
  dmrClient = {
    client: new DefaultApi(config(Configuration, tokenString, client)),
    token: tokenString,
  }

  return dmrClient.client as DefaultApi
}
