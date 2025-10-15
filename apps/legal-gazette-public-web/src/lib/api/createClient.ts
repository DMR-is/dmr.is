import { config } from '@dmr.is/api-client/createClient'

import { Configuration, LegalGazettePublicAPIApi } from '../../gen/fetch'

let client: LegalGazettePublicAPIApi | undefined

export const getClient = (idToken: string) => {
  if (typeof window === 'undefined' || !idToken) {
    return new LegalGazettePublicAPIApi(config(Configuration, idToken, 'LGWeb'))
  }

  return (client ??= new LegalGazettePublicAPIApi(
    config(Configuration, idToken, 'LGWeb'),
  ))
}
