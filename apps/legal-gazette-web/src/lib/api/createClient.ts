import { config } from '@dmr.is/api-client/createClient'

import { Configuration, LegalGazetteInternalAPIApi } from '../../gen/fetch'

let client: LegalGazetteInternalAPIApi | undefined

export const getLegalGazetteClient = (
  token: string,
): LegalGazetteInternalAPIApi => {
  if (typeof window === 'undefined' || !token) {
    return new LegalGazetteInternalAPIApi(
      config(Configuration, token, 'LGAdmin'),
    )
  }

  return (client ??= new LegalGazetteInternalAPIApi(
    config(Configuration, token, 'LGAdmin'),
  ))
}
