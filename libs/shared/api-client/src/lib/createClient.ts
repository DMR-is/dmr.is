import { IncomingMessage } from 'http'
import { NextApiRequest } from 'next'
import { NextApiRequestCookies } from 'next/dist/server/api-utils'

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
  credentials: 'include' | 'same-origin' | 'omit'
}

export const config = <Configuration> (
  Configuration: new (config?: CParameters) => Configuration,
  token: string,
  req?:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies
      }),
) => {
  const fetchWithCookie = createEnhancedFetch()

  return new Configuration({
    fetchApi: async (url: RequestInfo | URL, init: RequestInit = {}) => {
      if (typeof window === 'undefined' && req?.headers.cookie) {
        init.headers = {
          ...(init.headers || {}),
          cookie: req.headers.cookie,
        }
      }
      const finalUrl =
        typeof url === 'string' || url instanceof URL ? url.toString() : url

      return fetchWithCookie(finalUrl, init)
    },
    accessToken: token,
    basePath: getPath(),
    credentials: 'include',
  })
}

let dmrClient

export const getDmrClient = <DefaultApi, Configuration>(
  DefaultApi: new (config: Configuration) => DefaultApi,
  Configuration: new (config?: CParameters) => Configuration,
  token: string,
  req?:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies
      }),
): DefaultApi => {
  if (typeof window === 'undefined') {
    return new DefaultApi(config(Configuration, token, req))
  }

  return (dmrClient ??= new DefaultApi(config(Configuration, token)))
}
