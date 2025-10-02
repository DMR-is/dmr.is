import { getServerSession } from 'next-auth'

import { authOptions } from '../auth/authOptions'
import { ApiKey, getLegalGazetteClient } from './createClient'

export async function getServerClient<T extends ApiKey>(key: T) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('No session found')
  }

  return getLegalGazetteClient(key, session.idToken)
}
