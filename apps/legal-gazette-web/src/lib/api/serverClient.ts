import { getServerSession } from 'next-auth'

import { authOptions } from '../auth/authOptions'
import { getLegalGazetteClient } from './createClient'

export async function getServerClient(token?: string) {
  return getLegalGazetteClient(
    token ?? ((await getServerSession(authOptions))?.idToken as string),
  )
}
