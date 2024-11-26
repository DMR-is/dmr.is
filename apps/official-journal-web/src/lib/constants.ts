import { StringOption } from '@island.is/island-ui/core'

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
  MainTypes = '/tegundir',
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
  {
    pathname: Routes.MainTypes,
    title: 'Tegundir',
    order: 6,
  },
]

export const CaseDepartmentTabs: Array<StringOption & { key: string }> = [
  { label: 'A deild', value: 'a-deild', key: 'department' },
  { label: 'B deild', value: 'b-deild', key: 'department' },
  { label: 'C deild', value: 'c-deild', key: 'department' },
]

export const defaultFetcher = (url: string) =>
  fetch(url).then((res) => res.json())

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

  if (res.status === 204) {
    return
  }

  return await res.json()
}

export async function updateFetcher<T>(
  url: string,
  { arg, method }: { arg: T; method?: 'PUT' | 'POST' },
) {
  const response = await fetch(url, {
    method: method ? method : 'POST',
    body: JSON.stringify(arg),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 204) {
    return
  }

  if (!response.ok) {
    let message = null
    const error = await response.json()

    if (error.message === 'Validation failed') {
      message = 'Titill þarf að vera einkvæmur'
    }

    throw new Error(message ? message : error.message)
  }

  try {
    return await response.json()
  } catch (error) {
    console.log('wtf', error)
    return null
  }
}

export enum APIRotues {
  GetCase = '/api/cases/:id',
  GetCases = '/api/cases',
  MainTypes = '/api/mainTypes',
  MainType = '/api/mainTypes/:id',
  Types = '/api/types',
  Type = '/api/types/:id',
  GetEditorialOverview = '/api/cases/editorialOverview',
  GetDepartments = '/api/cases/departments',
  GetCategories = '/api/cases/categories',
  GetMainCategories = '/api/mainCategories',
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
  UpdateCategories = '/api/cases/:id/updateCategories',
  UpdateTitle = '/api/cases/:id/updateTitle',
  UpdatePublishDate = '/api/cases/:id/updatePublishDate',
  UpdatePaid = '/api/cases/:id/updatePaid',
  UpdateTag = '/api/cases/:id/updateTag',
  UpdateCommunicationStatus = '/api/cases/:id/updateCommunicationStatus',
  UpdateMainCategory = '/api/mainCategories/:id/update',
  CreateMainCategory = '/api/mainCategories/create',
  CreateMainCategoryCategories = '/api/mainCategories/:id/categories/create',
  CreateComment = '/api/cases/:id/comments/create',
  DeleteComment = '/api/cases/:id/comments/:cid/delete',
  DeleteMainCategory = '/api/mainCategories/:id/delete',
  DeleteMainCategoryCategory = '/api/mainCategories/:id/categories/:cid/delete',
  PublishCases = '/api/cases/publish',
  UnpublishCase = '/api/cases/:id/unpublish',
  RejectCase = '/api/cases/:id/reject',
}
