import { config } from '@dmr.is/api-client/createClient'

import { Configuration, LegalGazettePublicAPIApi } from '../../gen/fetch'

let client: LegalGazettePublicAPIApi | undefined
let publicClient: LegalGazettePublicAPIApi | undefined

export const getClient = (accessToken: string, idToken: string) => {
  if (typeof window === 'undefined' || !accessToken) {
    return new LegalGazettePublicAPIApi(config(Configuration, [accessToken, idToken], 'LGWeb'))
  }

  return (client ??= new LegalGazettePublicAPIApi(
    config(Configuration, [accessToken, idToken], 'LGWeb'),
  ))
}

export const getPublicClient = () => {
  if (typeof window === 'undefined') {
    return new LegalGazettePublicAPIApi(
      config(Configuration, '', 'LGPublicWeb'),
    )
  }
  return (publicClient ??= new LegalGazettePublicAPIApi(
    config(Configuration, '', 'LGPublicWeb'),
  ))
}
