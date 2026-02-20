import { getServerSession } from 'next-auth'

import { authOptions } from '../auth/authOptions'
import { getDmrClient } from './createClient'

export async function getServerClient(token?: string) {
  return getDmrClient(
    token ?? ((await getServerSession(authOptions))?.idToken as string),
  )
}
