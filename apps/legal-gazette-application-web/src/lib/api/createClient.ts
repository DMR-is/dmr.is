import { config } from '@dmr.is/api-client/createClient'

import {
  Configuration,
  LegalGazetteApplicationWebAPIApi,
} from '../../gen/fetch'

let client: LegalGazetteApplicationWebAPIApi | undefined

export const getLegalGazetteClient = (
  accessToken: string,
  idToken: string,
): LegalGazetteApplicationWebAPIApi => {
  if (typeof window === 'undefined' || !accessToken) {
    return new LegalGazetteApplicationWebAPIApi(
      config(Configuration, [accessToken, idToken], 'LGApplicationWeb'),
    )
  }

  return (client ??= new LegalGazetteApplicationWebAPIApi(
    config(Configuration, [accessToken, idToken], 'LGApplicationWeb'),
  ))
}
