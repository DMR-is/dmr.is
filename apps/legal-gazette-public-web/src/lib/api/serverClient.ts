import { getServerSession } from 'next-auth'

import { authOptions } from '../authOptions'
import { getClient } from './createClient'

export async function getServerClient() {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('No session found')
  }

  return getClient(session.idToken)
}
