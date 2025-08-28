import { getDmrClient as getDmrClientFromLib } from '@dmr.is/api-client/createClient'

import { Configuration, LegalGazetteApplicationWebAPIApi } from '../gen/fetch'

export const getClient = (idToken: string) => {
  return getDmrClientFromLib(
    LegalGazetteApplicationWebAPIApi,
    Configuration,
    idToken,
    'LGApplicationWeb',
  )
}
