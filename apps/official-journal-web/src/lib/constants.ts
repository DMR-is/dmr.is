import { getSession } from 'next-auth/react'

import {
  AlertMessageProps,
  AlertMessageType,
  StringOption,
} from '@island.is/island-ui/core'

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
  {
    pathname: Routes.MainTypes,
    title: 'Tegundir',
    order: 6,
  },
  { pathname: Routes.UserManagement, title: 'Notendur', order: 7 },
]

export const CaseDepartmentTabs: Array<StringOption & { key: string }> = [
  { label: 'A deild', value: 'a-deild', key: 'department' },
  { label: 'B deild', value: 'b-deild', key: 'department' },
  { label: 'C deild', value: 'c-deild', key: 'department' },
]

export const defaultFetcher = (url: string) =>
  fetch(url).then((res) => res.json())

type FetcherArgs<T> =
  | {
      withAuth?: boolean
      method: 'POST' | 'PUT'
      query?: URLSearchParams
      body?: T
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
  const withBody = (arg.method === 'POST' || arg.method === 'PUT') && arg.body

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

export enum APIRoutes {
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
  AdminUsers = '/api/admin-users',
  AdminUser = '/api/admin-users/:id',
  ApplicationUsers = '/api/application-users',
  ApplicationUser = '/api/application-users/:id',
  Institutions = '/api/institutions',
  Institution = '/api/institutions/:id',
  UpdateCaseType = '/api/cases/:id/updateType',
}

export class OJOIWebException extends Error {
  public status!: number
  public name!: string
  public type!: Extract<AlertMessageType, 'error' | 'info' | 'warning'>

  constructor(message: string) {
    super(message)
  }

  static serverError(message = 'Ekki tókst að vinna beiðni'): OJOIWebException {
    const error = new OJOIWebException(message)
    error.status = 500
    error.name = 'Villa kom upp í vefþjón'
    error.type = 'error'

    return error
  }

  static badRequest(
    message = 'Fyrirspurn er ekki á réttu formi',
  ): OJOIWebException {
    const error = new OJOIWebException(message)

    error.status = 400
    error.name = 'Ógild beiðni'
    error.type = 'warning'

    return error
  }

  static methodNotAllowed(
    message = 'Þessi fyrirspurn tekur ekki við þessari aðferð',
  ): OJOIWebException {
    const error = new OJOIWebException(message)
    error.status = 405
    error.name = 'Aðferð ekki leyfð'
    error.type = 'warning'

    return error
  }
}
