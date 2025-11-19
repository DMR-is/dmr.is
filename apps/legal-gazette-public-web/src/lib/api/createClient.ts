import { config } from '@dmr.is/api-client/createClient'

import { Configuration, LegalGazettePublicAPIApi } from '../../gen/fetch'

let client: LegalGazettePublicAPIApi | undefined

export const getClient = (accessToken: string) => {
  if (typeof window === 'undefined' || !accessToken) {
    return new LegalGazettePublicAPIApi(config(Configuration, accessToken, 'LGWeb'))
  }

  return (client ??= new LegalGazettePublicAPIApi(
    config(Configuration, accessToken, 'LGWeb'),
  ))
}
