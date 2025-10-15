import { config } from '@dmr.is/api-client/createClient'

import {
  Configuration,
  LegalGazetteApplicationWebAPIApi,
} from '../../gen/fetch'

let client: LegalGazetteApplicationWebAPIApi | undefined

export const getLegalGazetteClient = (
  token: string,
): LegalGazetteApplicationWebAPIApi => {
  if (typeof window === 'undefined' || !token) {
    return new LegalGazetteApplicationWebAPIApi(
      config(Configuration, token, 'LGApplicationWeb'),
    )
  }

  return (client ??= new LegalGazetteApplicationWebAPIApi(
    config(Configuration, token, 'LGApplicationWeb'),
  ))
}
