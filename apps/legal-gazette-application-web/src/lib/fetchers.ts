import { getSession } from 'next-auth/react'

import {
  CreateApplicationRequest,
  GetMyApplicationsRequest,
  SubmitApplicationRequest,
  UpdateApplicationRequest,
} from '../gen/fetch'
import { getClient } from './createClient'
import { safeCall } from './serverUtils'

const getClientWithSession = async () => {
  const session = await getSession()

  return getClient(session?.idToken as string)
}

export async function updateApplication(args: UpdateApplicationRequest) {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.updateApplication(args))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export const submitApplication = async (args: SubmitApplicationRequest) => {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.submitApplication(args))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function getMyApplications(args: GetMyApplicationsRequest) {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.getMyApplications(args))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function createApplication(args: CreateApplicationRequest) {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.createApplication(args))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function getCourtDistricts() {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.getCourtDistricts())

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export const getAdvertsByCaseId = async (caseId: string) => {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.getAdvertsByCaseId({ caseId }))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}
