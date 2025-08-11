import { getSession } from 'next-auth/react'

import {
  SubmitBankruptcyApplicationRequest,
  UpdateBankruptcyApplicationRequest,
} from '../gen/fetch'
import { getClient } from './createClient'
import { safeCall } from './serverUtils'

const getClientOrServerClient = async () => {
  const session = await getSession()

  return getClient(session?.idToken as string)
}

export async function updateBankruptcyApplication(
  args: UpdateBankruptcyApplicationRequest,
) {
  const client = await getClientOrServerClient()

  return client.updateBankruptcyApplication(args)
}

export async function submitBankruptcyApplication(
  args: SubmitBankruptcyApplicationRequest,
) {
  const client = await getClientOrServerClient()

  const results = await safeCall(() => client.submitBankruptcyApplication(args))

  if (results.error) {
    throw new Error(
      'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
    )
  }

  return results.data
}

export async function deleteApplication(applicationId: string) {
  const client = await getClientOrServerClient()

  return client.deleteApplication({ applicationId: applicationId })
}

export async function getMyApplications() {
  const client = await getClientOrServerClient()

  return client.getMyApplications()
}

export async function createBankruptcyCaseAndApplication() {
  const client = await getClientOrServerClient()

  return await client.createBankruptcyCaseAndApplication()
}

export async function getBankruptcyApplicationByCaseId(caseId: string) {
  const client = await getClientOrServerClient()

  return await client.getBankruptcyApplicationByCaseId({ caseId })
}

export async function getCourtDistricts() {
  const client = await getClientOrServerClient()

  return await client.getCourtDistricts()
}

export const getAdvertsByCaseId = async (caseId: string) => {
  const client = await getClientOrServerClient()

  return await client.getAdvertsByCaseId({ caseId })
}
