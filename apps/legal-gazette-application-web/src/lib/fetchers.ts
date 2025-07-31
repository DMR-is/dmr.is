import { getSession } from 'next-auth/react'

import { UpdateBankruptcyApplicationRequest } from '../gen/fetch'
import { getClient } from './createClient'

export async function updateBankruptcyApplication(
  args: UpdateBankruptcyApplicationRequest,
) {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.updateBankruptcyApplication(args)
}

export async function deleteApplication(applicationId: string) {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.deleteApplication({ applicationId: applicationId })
}

export async function getMyApplications() {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.getMyApplications()
}
