import { getSession } from 'next-auth/react'

import {
  SubmitBankruptcyApplicationRequest,
  UpdateBankruptcyApplicationRequest,
} from '../gen/fetch'
import { getClient } from './createClient'
import { safeCall } from './serverUtils'

export async function updateBankruptcyApplication(
  args: UpdateBankruptcyApplicationRequest,
) {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  return client.updateBankruptcyApplication(args)
}

export async function submitBankruptcyApplication(
  args: SubmitBankruptcyApplicationRequest,
) {
  const session = await getSession()
  const client = getClient(session?.idToken as string)

  const results = await safeCall(() => client.submitBankruptcyApplication(args))

  if (results.error) {
    console.log(results.error)
    throw new Error(
      'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
    )
  }

  return results.data
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
