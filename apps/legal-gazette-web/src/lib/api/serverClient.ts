import { getServerSession } from 'next-auth'

import { authOptions } from '../auth/authOptions'
import { ApiKey, getLegalGazetteClient } from './createClient'

export async function getServerClient<T extends ApiKey>(key: T, token?: string) {
  return getLegalGazetteClient(key, token ?? (await getServerSession(authOptions))?.idToken as string)
}
