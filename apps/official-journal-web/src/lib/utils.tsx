import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { ParsedUrlQuery } from 'querystring'
import { z } from 'zod'

import type { IconMapIcon } from '@island.is/island-ui/core'
import { StringOption } from '@island.is/island-ui/core'

import {
  CaseComment,
  CaseCommentCaseStatusEnum,
  CaseCommentType,
  CaseDetailed,
  CaseStatusEnum,
  CaseStatusTitleEnum,
  CaseTagTitleEnum,
  DepartmentEnum,
  GetCasesRequest,
  GetCasesWithDepartmentCountRequest,
  GetCasesWithStatusCountRequest,
  Signature,
} from '../gen/fetch'
import {
  FALLBACK_DOMAIN,
  JSON_ENDING,
  OJOIWebException,
  Routes,
} from './constants'

export const toFixed = (num: number, fixed: number) => {
  return num % 1 === 0 ? num : num.toFixed(fixed)
}

export const formatDate = (date: string, df = 'dd.MM.yyyy') => {
  try {
    return format(new Date(date), df, { locale: is })
  } catch (e) {
    throw new Error(`Could not format date: ${date}`)
  }
}

export const safelyExtractPathnameFromUrl = (url?: string) => {
  if (!url) return ''

  let pathname = new URL(url, FALLBACK_DOMAIN).pathname

  if (pathname.endsWith(JSON_ENDING)) {
    pathname = pathname.slice(0, pathname.indexOf(JSON_ENDING))
  }

  // Handle client side getServerSideProps calls
  if (pathname.startsWith('/_next/data')) {
    // The pathname looks like this then: '/_next/data/${bundleId}/...'

    // We split it to get: ['', '_next', 'data', `${bundleId}`, ...]
    const sections = pathname.split('/')

    // Then join the sections back together only keeping what makes up the url
    pathname = `/${sections.slice(4).join('/')}`
  }

  return pathname
}

export const mapTabIdToCaseStatus = (param?: string) => {
  if (!param) return CaseStatusTitleEnum.Innsent

  switch (param) {
    case CaseStatusTitleEnum.Innsent:
      return CaseStatusTitleEnum.Innsent
    case CaseStatusTitleEnum.Grunnvinnsla:
      return CaseStatusTitleEnum.Grunnvinnsla
    case CaseStatusTitleEnum.Yfirlestur:
      return CaseStatusTitleEnum.Yfirlestur
    case CaseStatusTitleEnum.Tilbúið:
      return CaseStatusTitleEnum.Tilbúið
    default:
      return CaseStatusTitleEnum.Innsent
  }
}

export const enumToOptions = (
  obj: typeof CaseStatusTitleEnum | typeof CaseTagTitleEnum,
): StringOption[] => {
  return Object.entries(obj).map(([_, value]) => ({
    label: value,
    value: value,
  }))
}

const caseStatusToIndex: Record<CaseStatusTitleEnum, number> = {
  [CaseStatusTitleEnum.Innsent]: 0,
  [CaseStatusTitleEnum.Grunnvinnsla]: 1,
  [CaseStatusTitleEnum.Yfirlestur]: 2,
  [CaseStatusTitleEnum.Tilbúið]: 3,
  [CaseStatusTitleEnum.ÚTgefið]: 4,
  [CaseStatusTitleEnum.TekiðÚrBirtingu]: 5,
  [CaseStatusTitleEnum.BirtinguHafnað]: 6,
}

export const generateCaseLink = (
  status: CaseStatusTitleEnum,
  caseId: string,
) => {
  let route = Routes.OverviewDetail

  if (
    status === CaseStatusTitleEnum.ÚTgefið ||
    status === CaseStatusTitleEnum.BirtinguHafnað ||
    status === CaseStatusTitleEnum.TekiðÚrBirtingu
  ) {
    route = Routes.ProccessingDetailCorrection
  }

  if (status === CaseStatusTitleEnum.Innsent) {
    route = Routes.ProcessingDetailSubmitted
  }
  if (status === CaseStatusTitleEnum.Grunnvinnsla) {
    route = Routes.ProcessingDetailInProgress
  }
  if (status === CaseStatusTitleEnum.Yfirlestur) {
    route = Routes.ProcessingDetailInReview
  }
  if (status === CaseStatusTitleEnum.Tilbúið) {
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

export const caseSteps: Array<CaseStep> = [
  'innsent',
  'grunnvinnsla',
  'yfirlestur',
  'tilbuid',
  'leidretting',
]

export const caseStatusToCaseStep = (
  status: string | CaseStep,
): CaseStep | null => {
  if (
    status === 'innsent' ||
    status === 'grunnvinnsla' ||
    status === 'yfirlestur' ||
    status === 'tilbuid'
  ) {
    return status
  }

  if (
    status === 'utgefid' ||
    status === 'birtingu-hafnad' ||
    status === 'tekid-ur-birtingu'
  ) {
    return 'leidretting'
  }

  return null
}

type StepsType = {
  step: CaseStep
  title: string
  notes?: React.ReactNode[]
  isActive: boolean
  isComplete: boolean
}

export const commentToNode = (comment: CaseComment) => {
  switch (comment.title) {
    case CaseCommentType.InnsentAf: {
      return (
        <>
          {comment.title} <strong>{comment.creator}</strong>
        </>
      )
    }
    case CaseCommentType.MerkirSérMálið: {
      return (
        <>
          <strong>{comment.creator}</strong> {comment.title}
        </>
      )
    }
    case CaseCommentType.FærirMálÁ: {
      return (
        <>
          <strong>{comment.creator}</strong> {comment.title}{' '}
          <strong>{comment.receiver}</strong>
        </>
      )
    }
    case CaseCommentType.FærirMálÍStöðuna: {
      return (
        <>
          <strong>{comment.creator}</strong> {comment.title}{' '}
          <strong>{comment.receiver}</strong>
        </>
      )
    }
    case CaseCommentType.GerirAthugasemd: {
      return (
        <>
          <strong>{comment.creator}</strong> {comment.title}
        </>
      )
    }
    case CaseCommentType.SkráirSkilaboð: {
      return (
        <>
          <strong>{comment.creator}</strong> {comment.title}
        </>
      )
    }
    default: {
      return (
        <>
          <strong>{comment.creator ?? ''}</strong> {comment.title ?? ''}
        </>
      )
    }
  }
}

export const generateSteps = (activeCase: CaseDetailed): StepsType[] => {
  const statusIndex = caseStatusToIndex[activeCase.status.title]
  const displayTypes = [
    CaseCommentType.InnsentAf,
    CaseCommentType.FærirMálÍStöðuna,
    CaseCommentType.FærirMálÁ,
  ]
  return [
    {
      step: 'innsent',
      title: 'innsent',
      isActive: statusIndex === 0,
      isComplete: statusIndex > 0,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Innsent &&
            displayTypes.includes(c.title),
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
            c.caseStatus === CaseCommentCaseStatusEnum.Grunnvinnsla &&
            displayTypes.includes(c.title),
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
            c.caseStatus === CaseCommentCaseStatusEnum.Yfirlestur &&
            displayTypes.includes(c.title),
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
            c.caseStatus === CaseCommentCaseStatusEnum.Tilbúið &&
            displayTypes.includes(c.title),
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
            (c.caseStatus === CaseCommentCaseStatusEnum.Tilbúið ||
              c.caseStatus === CaseCommentCaseStatusEnum.TekiðÚrBirtingu ||
              c.caseStatus === CaseCommentCaseStatusEnum.BirtinguHafnað) &&
            displayTypes.includes(c.title),
        )
        ?.map((c) => commentToNode(c)),
    },
  ]
}

type CaseProccessingSearchParams = {
  tab?: string
}

export const getCaseProcessingSearchParams = (
  query: ParsedUrlQuery,
): CaseProccessingSearchParams => {
  const params: CaseProccessingSearchParams = {}

  if (query?.tab) {
    params.tab = Array.isArray(query.tab) ? query.tab[0] : query.tab
  }

  return params
}

type GenerateOptionsParams = {
  label: string
  queryKey: string
  options: { id: string; slug: string; title: string }[] | undefined
}

export const generateOptions = ({
  label,
  queryKey,
  options,
}: GenerateOptionsParams) => {
  return {
    label,
    queryKey,
    options: options
      ? options.map((option) => ({
          label: option.title,
          value: option.slug,
        }))
      : [],
  }
}

export const getSignatureDate = (signatures: Signature[]) => {
  if (signatures.length === 0) {
    return null
  }

  return signatures[0].date
}

export const getCommentIcon = (comment: CaseComment): IconMapIcon => {
  if (comment.title === CaseCommentType.GerirAthugasemd) {
    return 'pencil'
  }

  if (comment.title === CaseCommentType.SkráirSkilaboð) {
    return 'arrowBack'
  }

  return 'arrowForward'
}

export const mapLetterToDepartmentSlug = (letter: string) =>
  letter === 'a' ? 'a-deild' : letter === 'b' ? 'b-deild' : 'c-deild'

export const mapDepartmentSlugToLetter = (slug: string) =>
  slug === 'a-deild' ? 'a' : slug === 'b-deild' ? 'b' : 'c'

export const getTimestamp = () => new Date().toISOString()

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
    case CaseStatusTitleEnum.ÚTgefið:
      return 'mint'
    case CaseStatusTitleEnum.BirtinguHafnað:
      return 'red'
    case CaseStatusTitleEnum.TekiðÚrBirtingu:
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
export const isCaseStatusTitleEnum = z.nativeEnum(CaseStatusEnum)

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

  const check = isCaseStatusTitleEnum.safeParse(
    queryParamToString.parse(query.status),
  )

  const statuses = queryParamToEnumArray(CaseStatusEnum).safeParse(
    query.statuses,
  )

  if (!check.success) {
    throw OJOIWebException.badRequest(
      'Status is required and must be a valid CaseStatusTitleEnum',
    )
  }

  return {
    status: check.data,
    statuses: statuses.success ? statuses.data : undefined,
    ...rest,
  }
}
