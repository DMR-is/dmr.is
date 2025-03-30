import { IncomingMessage } from 'http'
import { NextApiRequest } from 'next'
import { NextApiRequestCookies } from 'next/dist/server/api-utils'

import { Configuration, DefaultApi } from '../../gen/fetch'
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

export const config = (
  token: string,
  req?:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies
      }),
) => {
  const fetchWithCookie = createEnhancedFetch()

  return new Configuration({
    fetchApi: async (url, init = {}) => {
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

let dmrClient: DefaultApi | undefined

export const getDmrClient = (
  accessToken: string,
  req?:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies
      }),
) => {
  if (typeof window === 'undefined') {
    return new DefaultApi(config(accessToken, req))
  }

  return (dmrClient ??= new DefaultApi(config(accessToken)))
}
