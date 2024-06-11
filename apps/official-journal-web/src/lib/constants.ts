import { StringOption } from '@island.is/island-ui/core'

import {
  AssignEmployeeRequest,
  PostCasePublishBody,
  UpdateCaseStatusBody,
} from '../gen/fetch'
import { CaseOverviewSearchParams } from './types'

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

export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export async function assignEmployee(
  url: string,
  { arg }: { arg: AssignEmployeeRequest },
) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(arg),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => res)
}

export async function updateCaseStatus(
  url: string,
  { arg }: { arg: UpdateCaseStatusBody & { caseId: string } },
) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(arg),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res)
    .then((res) => res.json())
}

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
  }).then((res) => res.json())
}

export async function getCases(url: string, qs?: string) {
  const fullUrl = `${url}${qs ? `?${qs}` : ''}`
  return fetch(fullUrl, {
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

export enum APIRotues {
  Cases = '/api/cases',
  AssignEmployee = '/api/cases/assign',
  UpdateCaseStatus = '/api/cases/status',
  CreateComment = '/api/comments/create',
  DeleteComment = '/api/comments/delete',
  PublishCases = '/api/cases/publish',
}
