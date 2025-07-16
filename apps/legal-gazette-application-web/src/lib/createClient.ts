import { getDmrClient as getDmrClientFromLib } from '@dmr.is/api-client/createClient'

import { Configuration, LegalGazettePublicAPIApi } from '../gen/fetch'

export const getClient = (idToken: string) => {
  return getDmrClientFromLib(
    LegalGazettePublicAPIApi,
    Configuration,
    idToken,
    'LGWeb',
  )
}
