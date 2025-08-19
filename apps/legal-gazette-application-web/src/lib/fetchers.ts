import { getSession } from 'next-auth/react'

import {
  CreateDivisionMeetingForApplicationRequest,
  CreateRecallCaseAndApplicationRequest,
  SubmitCommonApplicationRequest,
  SubmitRecallApplicationRequest,
  UpdateCommonApplicationRequest,
  UpdateRecallApplicationRequest,
} from '../gen/fetch'
import { getClient } from './createClient'
import { safeCall } from './serverUtils'

const getClientWithSession = async () => {
  const session = await getSession()

  return getClient(session?.idToken as string)
}

export async function createDivisionMeetingForApplication(
  args: CreateDivisionMeetingForApplicationRequest,
) {
  const client = await getClientWithSession()

  return client.createDivisionMeetingForApplication(args)
}

export async function updateRecallApplication(
  args: UpdateRecallApplicationRequest,
) {
  const client = await getClientWithSession()

  return client.updateRecallApplication(args)
}

export async function updateCommonApplication(
  args: UpdateCommonApplicationRequest,
) {
  const client = await getClientWithSession()

  return client.updateCommonApplication(args)
}

export async function submitCommonApplication(
  args: SubmitCommonApplicationRequest,
) {
  const client = await getClientWithSession()

  return client.submitCommonApplication(args)
}

export async function submitRecallApplication(
  args: SubmitRecallApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.submitRecallApplication(args))

  if (results.error) {
    throw new Error(
      'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
    )
  }

  return results.data
}

export async function deleteApplication(applicationId: string) {
  const client = await getClientWithSession()

  return client.deleteRecallApplication({ applicationId: applicationId })
}

export async function getMyApplications() {
  const client = await getClientWithSession()

  return client.getMyApplications()
}

export async function createRecallCaseAndApplication(
  args: CreateRecallCaseAndApplicationRequest,
) {
  const client = await getClientWithSession()

  return await client.createRecallCaseAndApplication(args)
}

export async function createCommonCaseAndApplication() {
  const client = await getClientWithSession()

  return await client.createCommonCaseAndApplication()
}

export async function getRecallApplicationByCaseId(caseId: string) {
  const client = await getClientWithSession()

  return await client.getRecallApplicationByCaseId({ caseId })
}

export async function getCourtDistricts() {
  const client = await getClientWithSession()

  return await client.getCourtDistricts()
}

export const getAdvertsByCaseId = async (caseId: string) => {
  const client = await getClientWithSession()

  return await client.getAdvertsByCaseId({ caseId })
}
