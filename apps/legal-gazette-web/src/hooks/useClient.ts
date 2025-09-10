import { useSession } from 'next-auth/react'

import { getLegalGazetteClient } from '../lib/api/createClient'

type ClientID = Parameters<typeof getLegalGazetteClient>[0]

export const useClient = <T extends ClientID>(key: T) => {
  const session = useSession()

  if (!session.data?.idToken) {
    throw new Error('Unauthorized')
  }

  const client = getLegalGazetteClient(key, session.data.idToken)

  return client
}
