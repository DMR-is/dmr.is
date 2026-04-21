import { config } from '@dmr.is/api-client/createClient'

import { Configuration, DirectorateOfEqualityAPIApi } from '../../gen/fetch'

let client: DirectorateOfEqualityAPIApi | undefined

export const getDoEClient = (
  token: string,
): DirectorateOfEqualityAPIApi => {
  if (typeof window === 'undefined' || !token) {
    return new DirectorateOfEqualityAPIApi(
      config(Configuration, token, 'DoEWeb'),
    )
  }

  return (client ??= new DirectorateOfEqualityAPIApi(
    config(Configuration, token, 'DoEWeb'),
  ))
}
