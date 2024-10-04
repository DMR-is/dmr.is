import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { ParsedUrlQuery } from 'querystring'

import type { IconMapIcon } from '@island.is/island-ui/core'
import { StringOption } from '@island.is/island-ui/core'

import {
  Case,
  CaseComment,
  CaseCommentCaseStatusEnum,
  CaseCommentType,
  CaseStatusTitleEnum,
  CaseTagTitleEnum,
  Signature,
} from '../gen/fetch'
import { FALLBACK_DOMAIN, JSON_ENDING, Routes } from './constants'

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
      return CaseStatusTitleEnum.Tilbúið
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
    route = Routes.OverviewDetail
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

export type CaseStep = 'innsending' | 'grunnvinnsla' | 'yfirlestur' | 'tilbuid'

export const caseSteps: Array<CaseStep> = [
  'innsending',
  'grunnvinnsla',
  'yfirlestur',
  'tilbuid',
]

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

export const generateSteps = (activeCase: Case): StepsType[] => {
  const statusIndex = caseStatusToIndex[activeCase.status.title]
  const displayTypes = [
    CaseCommentType.InnsentAf,
    CaseCommentType.FærirMálÍStöðuna,
    CaseCommentType.FærirMálÁ,
  ]
  return [
    {
      step: 'innsending',
      title: 'Innsending',
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
