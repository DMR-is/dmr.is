import { getServerSession } from 'next-auth'

import { authOptions } from '../authOptions'
import { getLegalGazetteClient } from './createClient'

export async function getServerClient() {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('No session found')
  }

  return getLegalGazetteClient(session.accessToken)
}
