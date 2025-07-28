import { getSession } from 'next-auth/react'

import {
  CreateBankruptcyAdvertRequest,
  UpdateBankruptcyApplicationRequest,
} from '../gen/fetch'
import { getClient } from './createClient'

export async function updateBankruptcyApplication(
  arg: UpdateBankruptcyApplicationRequest,
) {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.updateBankruptcyApplication(arg)
}

export async function submitBankruptcyApplication(
  arg: CreateBankruptcyAdvertRequest,
) {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.createBankruptcyAdvert(arg)
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
