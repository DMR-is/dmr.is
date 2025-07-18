import { getSession } from 'next-auth/react'

import { UpdateBankruptcyApplicationRequest } from '../gen/fetch'
import { getClient } from './createClient'

export async function updateBankruptcyApplication(
  arg: UpdateBankruptcyApplicationRequest,
) {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.updateBankruptcyApplication(arg)
}

export async function createBankruptcyApplication() {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.createBankruptcyApplication()
}
