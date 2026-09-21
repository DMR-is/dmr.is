import { getDmrClient as getDmrClientFromLib } from '@dmr.is/api-client/createClient'

import { Configuration, DefaultApi } from '../../gen/fetch'

export const getDmrClient = (idToken: string) => {
  return getDmrClientFromLib(DefaultApi, Configuration, idToken)
}
