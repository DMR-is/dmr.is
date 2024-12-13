import { getSession } from 'next-auth/react'

import { StringOption } from '@island.is/island-ui/core'

import { PostCasePublishBody } from '../gen/fetch'

export const HEADER_HEIGHT = 112
export const MOBILE_HEADER_HEIGHT = 104
export const BLEED_HEIGHT = 56

export const PIE_CHART_DIMENSION = 240

export const FALLBACK_DOMAIN = 'https://admin.stjornartidindi.is' // THIS IS A MOCK, CHANGE TO CORRECT WHEN DEPLOYED

export const JSON_ENDING = '.json'

export const ADDITIONAL_DOCUMENTS = 'fylgiskjol'

export const COMMENTS_TO_HIDE = 4

export enum Routes {
  Dashboard = '/',
  MainCategories = '/yfirflokkar',
  ProcessingOverview = '/ritstjorn',
  ProcessingDetailSubmitted = '/ritstjorn/:caseId/innsent',
  ProcessingDetailInProgress = '/ritstjorn/:caseId/grunnvinnsla',
  ProcessingDetailInReview = '/ritstjorn/:caseId/yfirlestur',
  ProcessingDetailReady = '/ritstjorn/:caseId/tilbuid',
  ProccessingDetailCorrection = '/ritstjorn/:caseId/leidretting',
  PublishingOverview = '/utgafa',
  PublishingDetail = '/utgafa/:caseId',
  Overview = '/heildaryfirlit',
  OverviewDetail = '/heildaryfirlit/:caseId',
  Login = '/innskraning',
  UserManagement = '/notendur',
}

export enum PageTitles {
  Dashboard = 'Stjórnborð',
  CaseProcessing = 'Ritstjórn',
  CasePublishing = 'Útgáfa',
  CaseOverview = 'Heildaryfirlit',
}

type Path = {
  pathname: string
  title: string
  order: number
}

export const PagePaths: Array<Path> = [
  { pathname: Routes.Overview, title: PageTitles.CaseOverview, order: 4 },
  {
    pathname: Routes.ProcessingOverview,
    title: PageTitles.CaseProcessing,
    order: 2,
  },
  {
    pathname: Routes.PublishingOverview,
    title: PageTitles.CasePublishing,
    order: 3,
  },
  { pathname: Routes.Dashboard, title: PageTitles.Dashboard, order: 1 },
  { pathname: Routes.MainCategories, title: 'Yfirflokkar', order: 5 },
  { pathname: Routes.UserManagement, title: 'Notendur', order: 6 },
]

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
      // eslint-disable-next-line no-console
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

type FetcherArgs<T> =
  | {
      withAuth?: boolean
      method: 'POST' | 'PUT'
      query?: URLSearchParams
      body: T
    }
  | {
      withAuth?: boolean
      method: 'GET' | 'DELETE'
      query?: URLSearchParams
      body?: undefined
    }
export const fetcherV2 = async <TData, TBody = never>(
  url: string,
  { arg }: { arg: FetcherArgs<TBody> },
): Promise<TData> => {
  const withBody = arg.method === 'POST' || arg.method === 'PUT'

  const withAuth = arg.withAuth ?? true
  let authHeader = ''

  if (withAuth) {
    const session = await getSession()
    authHeader = session ? `${session.accessToken}` : ''
  }

  const fullUrl = arg.query ? `${url}?${arg.query.toString()}` : url

  const res = await fetch(fullUrl, {
    method: arg.method,
    body: withBody ? JSON.stringify(arg.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      authorization: authHeader,
    },
  })

  if (res.status === 204) {
    return {} as TData
  }

  if (!res.ok) {
    throw new Error('Error occured while fetching data')
  }

  return res.json()
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
  GetMainCategories = '/api/cases/mainCategories',
  GetTags = '/api/cases/tags',
  GetNextPublicationNumber = '/api/cases/nextPublicationNumber',
  GetCommunicationStatuses = '/api/cases/communicationStatuses',
  UpdateEmployee = '/api/cases/:id/updateEmployee',
  UpdateCaseStatus = '/api/cases/:id/updateStatus',
  UpdateNextCaseStatus = '/api/cases/:id/updateNextStatus',
  UpdatePreviousCaseStatus = '/api/cases/:id/updatePreviousStatus',
  UpdatePrice = '/api/cases/:id/updatePrice',
  UpdateDepartment = '/api/cases/:id/updateDepartment',
  UpdateAdvertHtml = '/api/cases/:id/updateAdvertHtml',
  UpdateType = '/api/cases/:id/updateType',
  UpdateCategories = '/api/cases/:id/updateCategories',
  UpdateTitle = '/api/cases/:id/updateTitle',
  UpdatePublishDate = '/api/cases/:id/updatePublishDate',
  UpdatePaid = '/api/cases/:id/updatePaid',
  UpdateTag = '/api/cases/:id/updateTag',
  UpdateCommunicationStatus = '/api/cases/:id/updateCommunicationStatus',
  UpdateMainCategory = '/api/cases/mainCategories/:id/update',
  CreateMainCategory = '/api/cases/mainCategories/create',
  CreateMainCategoryCategories = '/api/cases/mainCategories/:id/categories/create',
  CreateComment = '/api/cases/:id/comments/create',
  DeleteComment = '/api/cases/:id/comments/:cid/delete',
  DeleteMainCategory = '/api/cases/mainCategories/:id/delete',
  DeleteMainCategoryCategory = '/api/cases/mainCategories/:id/categories/:cid/delete',
  PublishCases = '/api/cases/publish',
  UnpublishCase = '/api/cases/:id/unpublish',
  RejectCase = '/api/cases/:id/reject',
  AdminUsers = '/api/admin-users',
  AdminUser = '/api/admin-users/:id',
  ApplicationUsers = '/api/application-users',
  ApplicationUser = '/api/application-users/:id',
  Institutions = '/api/institutions',
  Institution = '/api/institutions/:id',
}
