import { getServerIdToken } from '../auth/getServerToken'
import { getDoEClient } from './createClient'

export async function getServerClient(token?: string) {
  return getDoEClient(token ?? ((await getServerIdToken()) as string))
}
