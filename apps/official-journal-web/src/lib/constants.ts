import { StringOption } from '@island.is/island-ui/core'

import { HTTPMethod, PostCasePublishBody } from '../gen/fetch'
import { SWRAddCommentParams } from '../hooks/api'

export const HEADER_HEIGHT = 112
export const MOBILE_HEADER_HEIGHT = 104
export const BLEED_HEIGHT = 56

export const PIE_CHART_DIMENSION = 240

export const FALLBACK_DOMAIN = 'https://admin.stjornartidindi.is' // THIS IS A MOCK, CHANGE TO CORRECT WHEN DEPLOYED

export const JSON_ENDING = '.json'

export enum Routes {
  Dashboard = '/',
  ProcessingOverview = '/ritstjorn',
  ProcessingDetailSubmitted = '/ritstjorn/:caseId/innsending',
  ProcessingDetailInProgress = '/ritstjorn/:caseId/grunnvinnsla',
  ProcessingDetailInReview = '/ritstjorn/:caseId/yfirlestur',
  ProcessingDetailReady = '/ritstjorn/:caseId/tilbuid',
  PublishingOverview = '/utgafa',
  PublishingDetail = '/utgafa/:caseId',
  Overview = '/heildaryfirlit',
  OverviewDetail = '/heildaryfirlit/:caseId',
}

export const CaseDepartmentTabs: Array<StringOption & { key: string }> = [
  { label: 'A deild', value: 'a-deild', key: 'department' },
  { label: 'B deild', value: 'b-deild', key: 'department' },
  { label: 'C deild', value: 'c-deild', key: 'department' },
]

export const defaultFetcher = (url: string) =>
  fetch(url).then((res) => res.json())

export async function publishCases(
  url: string,
  { arg }: { arg: PostCasePublishBody },
) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(arg),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res)
    .catch((error) => {
      throw error
    })
}

export async function getCase(url: string) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const error = new Error('Error occured while fetching data')
    if (!res.ok) {
      console.error('Error occured while fetching data')
      error.message = await res.text()
      error.name = res.statusText

      throw error
    }

    return res.json()
  })
}

export async function deleteComment(
  url: string,
  { arg }: { arg: { caseId: string; commentId: string } },
) {
  const fullUrl = `${url}?caseId=${arg.caseId}&commentId=${arg.commentId}`
  return fetch(fullUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error('Error occured while fetching data')
    }

    return res
  })
}

export async function fetcher(
  url: string,
  { arg }: { arg: { method: 'GET' | 'DELETE' | undefined } } = {
    arg: { method: 'GET' },
  },
) {
  const res = await fetch(url, {
    method: arg.method,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const message = await res.text()

    throw new Error(message)
  }

  try {
    return await res.json()
  } catch (error) {
    return res
  }
}

export async function updateFetcher<T>(url: string, { arg }: { arg: T }) {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(arg),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const message = await res.text()

    throw new Error(message)
  }

  return res
}

export enum APIRotues {
  GetCase = '/api/cases/:id',
  GetCases = '/api/cases',
  GetEditorialOverview = '/api/cases/editorialOverview',
  GetDepartments = '/api/cases/departments',
  GetTypes = '/api/cases/types',
  GetCategories = '/api/cases/categories',
  UpdateEmployee = '/api/cases/:id/updateEmployee',
  UpdateCaseStatus = '/api/cases/:id/updateStatus',
  UpdateNextCaseStatus = '/api/cases/:id/updateNextStatus',
  UpdatePrice = '/api/cases/:id/updatePrice',
  UpdateDepartment = '/api/cases/:id/updateDepartment',
  UpdateType = '/api/cases/:id/updateType',
  UpdateCategories = '/api/cases/:id/updateCategories',
  UpdateTitle = '/api/cases/:id/updateTitle',
  UpdatePublishDate = '/api/cases/:id/updatePublishDate',
  CreateComment = '/api/cases/:id/comments/create',
  DeleteComment = '/api/cases/:id/comments/:cid/delete',
  PublishCases = '/api/cases/publish',
}
