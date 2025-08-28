import { getSession } from 'next-auth/react'

import {
  CreateDivisionEndingForApplicationRequest,
  CreateDivisionMeetingForApplicationRequest,
  CreateRecallAdvertForApplicationRequest,
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

export async function createRecallAdvertForApplication(
  args: CreateRecallAdvertForApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() =>
    client.createRecallAdvertForApplication(args),
  )

  if (results.error) {
    throw new Error(
      'Ekki tókst að búa til auglýsingu. Vinsamlegast reyndu aftur síðar.',
    )
  }

  return results.data
}

export async function createDivisionEndingForApplication(
  args: CreateDivisionEndingForApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() =>
    client.createDivisionEndingForApplication(args),
  )

  if (results.error) {
    throw new Error(
      'Ekki tókst að búa til skiptalok. Vinsamlegast reyndu aftur síðar.',
    )
  }

  return results.data
}

export async function createDivisionMeetingForApplication(
  args: CreateDivisionMeetingForApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() =>
    client.createDivisionMeetingForApplication(args),
  )

  if (results.error) {
    throw new Error(
      'Ekki tókst að búa til skiptafund. Vinsamlegast reyndu aftur síðar.',
    )
  }

  return results.data
}

export async function updateRecallApplication(
  args: UpdateRecallApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.updateRecallApplication(args))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function updateCommonApplication(
  args: UpdateCommonApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.updateCommonApplication(args))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function submitCommonApplication(
  args: SubmitCommonApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.submitCommonApplication(args))

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
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

  const results = await safeCall(() =>
    client.deleteRecallApplication({ applicationId: applicationId }),
  )

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function getMyApplications() {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.getMyApplications())

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function createRecallCaseAndApplication(
  args: CreateRecallCaseAndApplicationRequest,
) {
  const client = await getClientWithSession()

  const results = await safeCall(() =>
    client.createRecallCaseAndApplication(args),
  )

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function createCommonCaseAndApplication() {
  const client = await getClientWithSession()

  const results = await safeCall(() => client.createCommonCaseAndApplication())

  if (results.error) {
    throw new Error(results.error.details?.[0] ?? 'Villa kom upp')
  }

  return results.data
}

export async function getRecallApplicationByCaseId(caseId: string) {
  const client = await getClientWithSession()

  const results = await safeCall(() =>
    client.getRecallApplicationByCaseId({ caseId }),
  )

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
