/**
 * Legacy SWR constants — used by hooks/api/ (to be removed in Phase 4B/4C).
 * Do not add new code here. Migrate components to tRPC instead.
 */
import { getSession } from 'next-auth/react'

import type { AlertMessageType } from '@island.is/island-ui/core/AlertMessage/AlertMessage'

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
export const fetcher = async <TData, TBody = never>(
  url: string,
  { arg }: { arg: FetcherArgs<TBody> },
): Promise<TData> => {
  const withBody = (arg.method === 'POST' || arg.method === 'PUT') && arg.body

  const withAuth = arg.withAuth ?? true
  let authHeader = ''

  if (withAuth) {
    const session = await getSession()
    authHeader = session ? `${session.idToken}` : ''
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
    const err = await res.json()
    const error = new OJOIWebException(err.message)
    error.status = res.status
    error.name = err.name

    throw error
  }

  return res.json()
}

type SWRFetcherArgs<T> = {
  func: () => Promise<T>
}
export const swrFetcher = async <T>({
  func,
}: SWRFetcherArgs<T>): Promise<T> => {
  const res = await func()

  return res
}

export enum APIRoutes {
  GetCase = '/api/cases/:id',
  GetCases = '/api/cases',
  MainTypes = '/api/mainTypes',
  MainType = '/api/mainTypes/:id',
  Types = '/api/types',
  Type = '/api/types/:id',
  GetCasesWithStatusCount = '/api/cases/withStatusCount',
  GetCasesWithDepartmentCount = '/api/cases/withDepartmentCount',
  GetCasesWithPublicationNumber = '/api/cases/withPublicationNumber',
  GetDepartments = '/api/cases/departments',
  GetTags = '/api/cases/tags',
  GetCommunicationStatuses = '/api/cases/communicationStatuses',
  UpdateEmployee = '/api/cases/:id/updateEmployee',
  UpdateCaseStatus = '/api/cases/:id/updateStatus',
  UpdateNextCaseStatus = '/api/cases/:id/updateNextStatus',
  UpdatePreviousCaseStatus = '/api/cases/:id/updatePreviousStatus',
  UpdatePrice = '/api/cases/:id/updatePrice',
  GetPaymentStatus = '/api/cases/:id/getPaymentStatus',
  UpdateDepartment = '/api/cases/:id/updateDepartment',
  Signature = '/api/signatures/:id',
  SignatureRecord = '/api/signatures/:id/records/:recordId',
  SignatureRecords = '/api/signatures/:id/records',
  SignatureMember = '/api/signatures/:id/records/:recordId/members/:mid',
  SignatureMembers = '/api/signatures/:id/records/:recordId/members',
  UpdateAdvertHtml = '/api/cases/:id/updateAdvertHtml',
  UpdateAdvertWithCorrection = '/api/cases/:id/updateAdvertWithCorrection',
  UpdateCategories = '/api/cases/:id/updateCategories',
  UpdateTitle = '/api/cases/:id/updateTitle',
  UpdatePublishDate = '/api/cases/:id/updatePublishDate',
  UpdateFasttrack = '/api/cases/:id/updateFasttrack',
  UpdateTag = '/api/cases/:id/updateTag',
  UpdateCommunicationStatus = '/api/cases/:id/updateCommunicationStatus',
  Categories = '/api/categories',
  Category = '/api/categories/:id',
  MainCategories = '/api/mainCategories',
  MainCategory = '/api/mainCategories/:id',
  MergeCategories = '/api/categories/merge',
  MainCategoryCategories = '/api/mainCategories/:id/categories',
  MainCategoryCategory = '/api/mainCategories/:id/categories/:cid',
  CreatInternalComment = '/api/cases/:id/comments/createInternalComment',
  CreatExternalComment = '/api/cases/:id/comments/createExternalComment',
  DeleteComment = '/api/cases/:id/comments/:cid/delete',
  PublishCases = '/api/cases/publish',
  UnpublishCase = '/api/cases/:id/unpublish',
  RejectCase = '/api/cases/:id/reject',
  Institutions = '/api/institutions',
  Institution = '/api/institutions/:id',
  UpdateCaseType = '/api/cases/:id/updateType',
  GetStatisticsForDepartment = '/api/statistics/department',
  GetStatisticsOverview = '/api/statistics/overview',
  Adverts = '/api/cases/advert',
  Advert = '/api/cases/advert/:id',
  UpdateAdvertPDF = '/api/cases/advert/:id/updatePdf',
  PreviewPdf = '/api/cases/:id/previewPdf',
}

export class OJOIWebException extends Error {
  public status!: number
  public name!: string
  public type!: Extract<AlertMessageType, 'error' | 'info' | 'warning'>

  constructor(message: string) {
    super(message)
  }

  static serverError(
    message = 'Ekki tókst að vinna beiðni',
  ): OJOIWebException {
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
