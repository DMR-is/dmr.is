import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { ParsedUrlQuery } from 'querystring'
import { z } from 'zod'

import { Stack, Text } from '@island.is/island-ui/core'
import { EditorFileUploader } from '@island.is/regulations-tools/EditorFrame'

import {
  BaseEntity,
  CaseActionEnum,
  CaseDetailed,
  CaseStatusEnum,
  CommentDto,
  DepartmentEnum,
  GetCasesRequest,
  GetCasesWithDepartmentCountRequest,
  GetCasesWithStatusCountRequest,
} from '../gen/fetch'
import { getDmrClient } from '../lib/api/createClient'
import { DOCUMENT_ASSETS } from '../lib/constants'
import { OJOIWebException, Routes } from './constants'

export const toFixed = (num: number, fixed: number) => {
  return num % 1 === 0 ? num : num.toFixed(fixed)
}

export const formatDate = (date: Date | string, df = 'dd.MM.yyyy') => {
  try {
    const dateToUse = typeof date === 'string' ? new Date(date) : date
    return format(dateToUse, df, { locale: is })
  } catch (e) {
    throw new Error(`Could not format date: ${date}`)
  }
}

export const mapTabIdToCaseStatus = (param?: string) => {
  if (!param) return CaseStatusEnum.Innsent

  switch (param) {
    case CaseStatusEnum.Innsent:
      return CaseStatusEnum.Innsent
    case CaseStatusEnum.Grunnvinnsla:
      return CaseStatusEnum.Grunnvinnsla
    case CaseStatusEnum.Yfirlestur:
      return CaseStatusEnum.Yfirlestur
    case CaseStatusEnum.Tilbúið:
      return CaseStatusEnum.Tilbúið
    default:
      return CaseStatusEnum.Innsent
  }
}

const caseStatusToIndex: Record<CaseStatusEnum, number> = {
  [CaseStatusEnum.Innsent]: 0,
  [CaseStatusEnum.Grunnvinnsla]: 1,
  [CaseStatusEnum.Yfirlestur]: 2,
  [CaseStatusEnum.Tilbúið]: 3,
  [CaseStatusEnum.ÚTgefið]: 4,
  [CaseStatusEnum.TekiðÚrBirtingu]: 5,
  [CaseStatusEnum.BirtinguHafnað]: 6,
}

export const generateCaseLink = (status: CaseStatusEnum, caseId: string) => {
  let route = Routes.OverviewDetail

  if (
    status === CaseStatusEnum.ÚTgefið ||
    status === CaseStatusEnum.BirtinguHafnað ||
    status === CaseStatusEnum.TekiðÚrBirtingu
  ) {
    route = Routes.ProccessingDetailCorrection
  }

  if (status === CaseStatusEnum.Innsent) {
    route = Routes.ProcessingDetailSubmitted
  }
  if (status === CaseStatusEnum.Grunnvinnsla) {
    route = Routes.ProcessingDetailInProgress
  }
  if (status === CaseStatusEnum.Yfirlestur) {
    route = Routes.ProcessingDetailInReview
  }
  if (status === CaseStatusEnum.Tilbúið) {
    route = Routes.ProcessingDetailReady
  }

  return route.replace(':caseId', caseId)
}

export type CaseStep =
  | 'innsent'
  | 'grunnvinnsla'
  | 'yfirlestur'
  | 'tilbuid'
  | 'leidretting'

type StepsType = {
  step: CaseStep
  title: string
  notes?: React.ReactNode[]
  isActive: boolean
  isComplete: boolean
}

function getIcelandicDative(days: number) {
  // Check if the number ends in 1 but is not 11
  if (days % 10 === 1 && days % 100 !== 11) {
    return 'degi'
  }
  return 'dögum'
}

export const imageTiers = [
  {
    value: 'B108',
    label: '1-5 myndir í máli',
  },
  {
    value: 'B109',
    label: '6-15 myndir í máli',
  },
  {
    value: 'B110',
    label: '>15 myndir í máli',
  },
  {
    value: '',
    label: 'Engar myndir',
  },
]

export const convertDateToDaysAgo = (dateIso: string): string => {
  try {
    const date = new Date(dateIso)

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / (1000 * 3600 * 24))

    if (diffDays === 0) {
      return 'Í dag'
    }

    if (diffDays === 1) {
      return 'í gær'
    }

    return `f. ${diffDays} ${getIcelandicDative(diffDays)}`
  } catch (error) {
    return 'Ekki vitað'
  }
}

export const commentToNode = (comment: CommentDto) => {
  switch (comment.action) {
    case CaseActionEnum.SUBMIT: {
      return (
        <>
          Innsent af: <strong>{comment.creator?.title}</strong>
        </>
      )
    }
    case CaseActionEnum.ASSIGNSELF: {
      return (
        <>
          <strong>{comment.creator.title}</strong> merkir sér málið.
        </>
      )
    }
    case CaseActionEnum.ASSIGNUSER: {
      return (
        <>
          <strong>{comment.creator.title}</strong> færir mál á{' '}
          <strong>{comment.receiver?.title}</strong>
        </>
      )
    }
    case CaseActionEnum.UPDATESTATUS: {
      return (
        <>
          <strong>{comment.creator.title}</strong> færir mál í stöðuna:{' '}
          <strong>{comment.receiver?.title}</strong>
        </>
      )
    }
    case CaseActionEnum.APPLICATIONCOMMENT:
    case CaseActionEnum.INTERNALCOMMENT: {
      return (
        <Stack space={1}>
          <span>
            <strong>{comment.creator.title}</strong> gerir athugasemd.
          </span>
          <Text>{comment.comment}</Text>
        </Stack>
      )
    }
    case CaseActionEnum.EXTERNALCOMMENT: {
      return (
        <Stack space={1}>
          <span>
            <strong>{comment.creator.title}</strong> skráir skilaboð.
          </span>
          <Text>{comment.comment}</Text>
        </Stack>
      )
    }
    default: {
      return (
        <>
          <strong>{comment.creator.title}</strong>
        </>
      )
    }
  }
}

export const generateSteps = (activeCase: CaseDetailed): StepsType[] => {
  const statusIndex = caseStatusToIndex[activeCase.status.title]
  const displayTypes = [
    CaseActionEnum.SUBMIT,
    CaseActionEnum.UPDATESTATUS,
    CaseActionEnum.ASSIGNUSER,
  ]
  return [
    {
      step: 'innsent',
      title: 'Innsent',
      isActive: statusIndex === 0,
      isComplete: statusIndex > 0,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.caseStatus.title === CaseStatusEnum.Innsent &&
            displayTypes.includes(c.action),
        )
        ?.map((c) => commentToNode(c)),
    },
    {
      step: 'grunnvinnsla',
      title: 'Grunnvinnsla',
      isActive: statusIndex === 1,
      isComplete: statusIndex > 1,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.caseStatus.title === CaseStatusEnum.Grunnvinnsla &&
            displayTypes.includes(c.action),
        )
        ?.map((c) => commentToNode(c)),
    },
    {
      step: 'yfirlestur',
      title: 'Yfirlestur',
      isActive: statusIndex === 2,
      isComplete: statusIndex > 2,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.caseStatus.title === CaseStatusEnum.Yfirlestur &&
            displayTypes.includes(c.action),
        )
        ?.map((c) => commentToNode(c)),
    },
    {
      step: 'tilbuid',
      title: 'Tilbúið til útgáfu',
      isActive: statusIndex === 3,
      isComplete: statusIndex > 3,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.caseStatus.title === CaseStatusEnum.Tilbúið &&
            displayTypes.includes(c.action),
        )
        ?.map((c) => commentToNode(c)),
    },
    {
      step: 'leidretting',
      title: 'Leiðrétta mál',
      isActive: statusIndex > 3,
      isComplete: statusIndex > 3,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.caseStatus.title === CaseStatusEnum.Tilbúið ||
            c.caseStatus.title === CaseStatusEnum.TekiðÚrBirtingu ||
            c.caseStatus.title === CaseStatusEnum.BirtinguHafnað,
        )
        ?.map((c) => commentToNode(c)),
    },
  ]
}

export const createOptionsWithCapitalize = <T extends BaseEntity>(arr: T[]) => {
  return arr.map((item) => ({
    label: item.title.charAt(0).toUpperCase() + item.title.slice(1).toLowerCase(),
    value: item.id,
  }))
}

export const createOptions = <T extends BaseEntity>(arr: T[]) => {
  return arr.map((item) => ({
    label: item.title,
    value: item.id,
  }))
}

export const deleteUndefined = <T,>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any> | undefined,
): T => {
  if (obj) {
    Object.keys(obj).forEach((key: string) => {
      if (obj[key] && typeof obj[key] === 'object') {
        deleteUndefined(obj[key])
      } else if (typeof obj[key] === 'undefined') {
        delete obj[key]
      }
    })
  }
  return obj as T
}

export const getOverviewStatusColor = (status: string) => {
  switch (status) {
    case CaseStatusEnum.ÚTgefið:
      return 'mint'
    case CaseStatusEnum.BirtinguHafnað:
      return 'red'
    case CaseStatusEnum.TekiðÚrBirtingu:
      return 'rose'
    default:
      return 'blue'
  }
}

/**
 *
 * @param val String value tipically from query params
 * @param defaultValue if the value is not a number, return this value
 * @returns the parsed integer or the default value
 */
export const tryParseInt = (
  val: string | undefined,
  defaultValue = 0,
): number => {
  if (!val) {
    return defaultValue
  }
  const parsed = parseInt(val, 10)

  return !Number.isNaN(parsed) ? parsed : defaultValue
}

export const loginRedirect = (callbackUrl?: string) => {
  let fullUrl: string = Routes.Login

  const isRelativeUrl = callbackUrl && callbackUrl.startsWith('/')

  if (callbackUrl && isRelativeUrl && callbackUrl !== '/') {
    fullUrl = `${Routes.Login}?callbackUrl=${callbackUrl}`
  }

  return {
    redirect: {
      destination: fullUrl,
      permanent: false,
    },
  }
}

export const generateParams = (params?: Record<string, any>) => {
  const urlSearchParmas = new URLSearchParams()

  if (params) {
    Object.keys(params).forEach((key) => {
      const val = params[key]
      if (val !== undefined && val !== null) {
        if (Array.isArray(params[key])) {
          params[key].forEach((value) => {
            urlSearchParmas.append(key, value)
          })
        } else {
          urlSearchParmas.append(key, params[key])
        }
      }
    })
  }

  return urlSearchParmas
}

const queryParamUnion = z.union([
  z.string(),
  z.array(z.string()),
  z.undefined(),
])

const queryParamToString = queryParamUnion.transform(
  (val): string | undefined => {
    if (!val) return undefined

    if (Array.isArray(val)) {
      return val[0]
    }

    return val
  },
)

const queryParamToNumber = queryParamUnion.transform(
  (val): number | undefined => {
    if (!val) return undefined

    if (Array.isArray(val)) {
      const parsed = parseInt(val[0], 10)
      if (Number.isNaN(parsed)) return undefined

      return parsed
    }

    const parsed = parseInt(val, 10)
    if (Number.isNaN(parsed)) return undefined

    return parsed
  },
)

const queryParamToBoolean = queryParamUnion.transform(
  (val): boolean | undefined => {
    if (!val) return undefined

    if (Array.isArray(val)) {
      return val[0] === 'true'
    }

    return val === 'true'
  },
)

const queryParamToStringArray = queryParamUnion.transform(
  (val): string[] | undefined => {
    if (!val) return undefined

    if (Array.isArray(val)) {
      return val
    }

    return val.split(',')
  },
)

const queryParamToEnumArray = <T extends string>(enumType: Record<string, T>) =>
  queryParamUnion.transform((val): T[] | undefined => {
    if (!val) return undefined

    if (Array.isArray(val)) {
      return val.filter((v) => Object.keys(enumType).includes(v)) as T[]
    }

    return val
      .split(',')
      .filter((v) => Object.keys(enumType).includes(v)) as T[]
  })

export const isDepartmentEnum = z.nativeEnum(DepartmentEnum)
export const isCaseStatusEnum = z.nativeEnum(CaseStatusEnum)

export const transformQueryToCaseParams = (
  query: ParsedUrlQuery,
): GetCasesRequest => {
  return {
    id: queryParamToStringArray.parse(query.id),
    applicationId: queryParamToString.parse(query.applicationId),
    search: queryParamToString.parse(query.search),
    department: queryParamToStringArray.parse(query.department),
    category: queryParamToStringArray.parse(query.category),
    status: queryParamToStringArray.parse(query.status),
    type: queryParamToStringArray.parse(query.type),
    year: queryParamToNumber.parse(query.year),
    institution: queryParamToString.parse(query.institution),
    fastTrack: queryParamToBoolean.parse(query.fastTrack),
    published: queryParamToBoolean.parse(query.published),
    employeeId: queryParamToString.parse(query.employeeId),
    fromDate: queryParamToString.parse(query.fromDate),
    toDate: queryParamToString.parse(query.toDate),
    page: queryParamToNumber.parse(query.page),
    pageSize: queryParamToNumber.parse(query.pageSize),
    sortBy: queryParamToString.parse(query.sortBy),
    direction: queryParamToString.parse(query.direction),
  }
}

export const transformQueryToCaseWithDepartmentCountParams = (
  query: ParsedUrlQuery,
): GetCasesWithDepartmentCountRequest => {
  const { department: _, ...rest } = transformQueryToCaseParams(query)

  const department = queryParamToString.parse(query.department)

  const check = isDepartmentEnum.safeParse(department)

  if (!check.success) {
    throw OJOIWebException.badRequest(
      'Department is required and must be a valid DepartmentEnum',
    )
  }

  return {
    department: check.data,
    ...rest,
  }
}

export const transformQueryToCasesWithStatusCountParams = (
  query: ParsedUrlQuery,
): GetCasesWithStatusCountRequest => {
  const { status: _, ...rest } = transformQueryToCaseParams(query)

  const check = isCaseStatusEnum.safeParse(
    queryParamToString.parse(query.status),
  )

  const statuses = queryParamToEnumArray(CaseStatusEnum).safeParse(
    query.statuses,
  )

  if (!check.success) {
    throw OJOIWebException.badRequest(
      'Status is required and must be a valid CaseStatusEnum',
    )
  }

  return {
    status: check.data,
    statuses: statuses.success ? statuses.data : undefined,
    ...rest,
  }
}

export const sliceFirstAndLast = <T,>(arr: T[], count: number): T[] => {
  if (arr.length === 0 || count === 0) return []
  if (arr.length <= count) return arr

  return [arr[0], ...arr.slice(-count)]
}

export const getPreviousStatus = (
  status: CaseStatusEnum,
): CaseStatusEnum | null => {
  switch (status) {
    case CaseStatusEnum.Innsent:
      return null
    case CaseStatusEnum.Grunnvinnsla:
      return CaseStatusEnum.Innsent
    case CaseStatusEnum.Yfirlestur:
      return CaseStatusEnum.Grunnvinnsla
    case CaseStatusEnum.Tilbúið:
      return CaseStatusEnum.Yfirlestur
    default: {
      return null
    }
  }
}

export const getNextStatus = (
  status: CaseStatusEnum,
): CaseStatusEnum | null => {
  switch (status) {
    case CaseStatusEnum.Innsent:
      return CaseStatusEnum.Grunnvinnsla
    case CaseStatusEnum.Grunnvinnsla:
      return CaseStatusEnum.Yfirlestur
    case CaseStatusEnum.Yfirlestur:
      return CaseStatusEnum.Tilbúið
    case CaseStatusEnum.Tilbúið:
      return null
    default: {
      return null
    }
  }
}

export function useFileUploader(
  applicationId: string,
  caseId: string,
  idToken: string,
) {
  const fileUploader =
    (): EditorFileUploader => async (blobInfo, success, failure, progress) => {
      const file = blobInfo.blob() as File
      const key = `${DOCUMENT_ASSETS}/${applicationId}/${file.name}`
      const dmrClient = getDmrClient(idToken as string)

      const fileExtension = file.name.split('.').pop()

      if (!fileExtension) {
        failure(`Skráargerð ekki í boði`)
        return
      }

      try {
        const response = await dmrClient.uploadApplicationAttachment({
          caseId: caseId,
          postApplicationAssetBody: {
            key,
          },
        })
        const { cdn, url } = response

        if (!url) {
          failure(`Ekki tókst að vista skjal í gagnageymslu: slóð ekki í svari`)
          return
        }

        const didUpload = await fetch(url, {
          headers: {
            'Content-Type': file.type,
            'Content-Length': file.size.toString(),
          },
          method: 'PUT',
          body: file,
        })

        if (!didUpload.ok) {
          failure(`Ekki tókst að hlaða upp skjali í gagnageymslu S3`)
          return
        }

        const urlRes = `${cdn}/${key}`

        success(urlRes)
      } catch (error) {
        failure(
          'Vandamál við að hlaða upp myndum. Vinsamlegast reynið aftur síðar.',
        )
      }
    }
  return fileUploader
}

export const numberFormat = (value: number): string =>
  value
    .toString()
    .split('.')[0]
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const amountFormat = (value?: number | string | null): string => {
  const inputValue = typeof value === 'string' ? parseInt(value) : value
  if (inputValue === undefined || inputValue === null || isNaN(inputValue)) {
    return ''
  }
  return typeof inputValue === 'number' ? numberFormat(inputValue) + ' kr.' : ''
}
