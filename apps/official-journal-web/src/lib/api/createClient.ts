import { IncomingMessage } from 'http'
import { NextApiRequest } from 'next'
import { NextApiRequestCookies } from 'next/dist/server/api-utils'
import { getDmrClient as getDmrClientFromLib } from '@dmr.is/api-client'

import { Configuration, DefaultApi } from '../../gen/fetch'

export const getDmrClient = (
  idToken: string,
  req?:
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies
      }),
) => {
  return getDmrClientFromLib(DefaultApi, Configuration, idToken, req)
}
