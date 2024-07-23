import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { ParsedUrlQuery } from 'querystring'

import { StringOption } from '@island.is/island-ui/core'

import {
  CaseComment,
  CaseCommentCaseStatusEnum,
  CaseCommentTaskTitleEnum,
  CaseCommentTypeEnum,
  CaseStatusEnum,
  CaseTagValueEnum,
  CaseWithAdvert,
} from '../gen/fetch'
import { useQueryParams } from '../hooks/useQueryParams'
import { FALLBACK_DOMAIN, JSON_ENDING, Routes } from './constants'

export const formatDate = (date: string, df: string = 'dd.MM.yyyy') => {
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
  if (!param) return CaseStatusEnum.Innsent

  switch (param) {
    case CaseStatusEnum.Innsent:
      return CaseStatusEnum.Innsent
    case CaseStatusEnum.Grunnvinnsla:
      return CaseStatusEnum.Grunnvinnsla
    case CaseStatusEnum.Yfirlestur:
      return CaseStatusEnum.Yfirlestur
    case CaseStatusEnum.Tilbi:
      return CaseStatusEnum.Tilbi
    default:
      return CaseStatusEnum.Tilbi
  }
}

export const enumToOptions = (
  obj: typeof CaseStatusEnum | typeof CaseTagValueEnum,
): StringOption[] => {
  return Object.entries(obj).map(([_, value]) => ({
    label: value,
    value: value,
  }))
}

const caseStatusToIndex: Record<CaseStatusEnum, number> = {
  [CaseStatusEnum.Innsent]: 0,
  [CaseStatusEnum.Grunnvinnsla]: 1,
  [CaseStatusEnum.Yfirlestur]: 2,
  [CaseStatusEnum.Tilbi]: 3,
  [CaseStatusEnum.Tgefi]: 4,
  [CaseStatusEnum.TekiRBirtingu]: 5,
  [CaseStatusEnum.BirtinguHafna]: 6,
}

export const generateCaseLink = (status: CaseStatusEnum, caseId: string) => {
  let route = Routes.OverviewDetail

  if (
    status === CaseStatusEnum.Tgefi ||
    status === CaseStatusEnum.BirtinguHafna ||
    status === CaseStatusEnum.TekiRBirtingu
  ) {
    route = Routes.OverviewDetail
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
  if (status === CaseStatusEnum.Tilbi) {
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

export const commentTaskToNode = (
  task: CaseComment['task'],
  status: CaseComment['caseStatus'],
) => {
  switch (task.title) {
    case CaseCommentTaskTitleEnum.InnsentAf: {
      return (
        <>
          {task.title} <strong>{task.from}</strong>
        </>
      )
    }
    case CaseCommentTaskTitleEnum.MerkirSrMli: {
      return (
        <>
          <strong>{task.to}</strong> {task.title}
        </>
      )
    }
    case CaseCommentTaskTitleEnum.FrirMl: {
      return (
        <>
          <strong>{task.from}</strong> {task.title} <strong>{task.to}</strong>
        </>
      )
    }
    case CaseCommentTaskTitleEnum.FrirMlStuna: {
      return (
        <>
          <strong>{task.from}</strong> {task.title} <strong>{status}</strong>
        </>
      )
    }
    case CaseCommentTaskTitleEnum.GerirAthugasemd: {
      return (
        <>
          <strong>{task.from}</strong> {task.title}
        </>
      )
    }
    case CaseCommentTaskTitleEnum.SkrirSkilabo: {
      return (
        <>
          <strong>{task.from}</strong> {task.title}
        </>
      )
    }
    default: {
      return (
        <>
          <strong>{task.from ?? ''}</strong> {task.title ?? ''}
        </>
      )
    }
  }
}

export const generateSteps = (activeCase: CaseWithAdvert): StepsType[] => {
  const statusIndex = caseStatusToIndex[activeCase.activeCase.status]
  const displayTypes = [CaseCommentTypeEnum.Submit, CaseCommentTypeEnum.Assign]
  return [
    {
      step: 'innsending',
      title: 'Innsending',
      isActive: statusIndex === 0,
      isComplete: statusIndex > 0,
      notes: activeCase.activeCase.comments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Innsent &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task, caseStatus }) => commentTaskToNode(task, caseStatus)),
    },
    {
      step: 'grunnvinnsla',
      title: 'Grunnvinnsla',
      isActive: statusIndex === 1,
      isComplete: statusIndex > 1,
      notes: activeCase.activeCase.comments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Grunnvinnsla &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task, caseStatus }) => commentTaskToNode(task, caseStatus)),
    },
    {
      step: 'yfirlestur',
      title: 'Yfirlestur',
      isActive: statusIndex === 2,
      isComplete: statusIndex > 2,
      notes: activeCase.activeCase.comments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Yfirlestur &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task, caseStatus }) => commentTaskToNode(task, caseStatus)),
    },
    {
      step: 'tilbuid',
      title: 'Tilbúið til útgáfu',
      isActive: statusIndex === 3,
      isComplete: statusIndex > 3,
      notes: activeCase.activeCase.comments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Tilbi &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task, caseStatus }) => commentTaskToNode(task, caseStatus)),
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
