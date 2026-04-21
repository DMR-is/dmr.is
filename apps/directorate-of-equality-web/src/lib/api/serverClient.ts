import { getServerSession } from 'next-auth'

import { authOptions } from '../auth/authOptions'
import { getDoEClient } from './createClient'

export async function getServerClient(token?: string) {
  return getDoEClient(
    token ?? ((await getServerSession(authOptions))?.idToken as string),
  )
}
