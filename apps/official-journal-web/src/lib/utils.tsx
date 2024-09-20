import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { ParsedUrlQuery } from 'querystring'

import { StringOption } from '@island.is/island-ui/core'

import {
  Case,
  CaseComment,
  CaseCommentTask,
  CaseCommentTitleTitleEnum,
  CaseCommentTypeTitleEnum,
  CaseStatus,
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
    case CaseStatusTitleEnum.Tilbi:
      return CaseStatusTitleEnum.Tilbi
    default:
      return CaseStatusTitleEnum.Tilbi
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
  [CaseStatusTitleEnum.Tilbi]: 3,
  [CaseStatusTitleEnum.Tgefi]: 4,
  [CaseStatusTitleEnum.TekiRBirtingu]: 5,
  [CaseStatusTitleEnum.BirtinguHafna]: 6,
}

export const generateCaseLink = (
  status: CaseStatusTitleEnum,
  caseId: string,
) => {
  let route = Routes.OverviewDetail

  if (
    status === CaseStatusTitleEnum.Tgefi ||
    status === CaseStatusTitleEnum.BirtinguHafna ||
    status === CaseStatusTitleEnum.TekiRBirtingu
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
  if (status === CaseStatusTitleEnum.Tilbi) {
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
  task: CaseCommentTask,
  status: CaseStatusTitleEnum,
) => {
  switch (task.title.title) {
    case CaseCommentTitleTitleEnum.InnsentAf: {
      return (
        <>
          {task.title.title} <strong>{task.from}</strong>
        </>
      )
    }
    case CaseCommentTitleTitleEnum.MerkirSrMli: {
      return (
        <>
          <strong>{task.to}</strong> {task.title.title}
        </>
      )
    }
    case CaseCommentTitleTitleEnum.FrirMl: {
      return (
        <>
          <strong>{task.from ? task.from : 'Óþekktur notandi'}</strong>{' '}
          {task.title.title} <strong>{task.to}</strong>
        </>
      )
    }
    case CaseCommentTitleTitleEnum.FrirMlStuna: {
      return (
        <>
          <strong>{task.from}</strong> {task.title.title}{' '}
          <strong>{status}</strong>
        </>
      )
    }
    case CaseCommentTitleTitleEnum.GerirAthugasemd: {
      return (
        <>
          <strong>{task.from}</strong> {task.title.title}
        </>
      )
    }
    case CaseCommentTitleTitleEnum.SkrirSkilabo: {
      return (
        <>
          <strong>{task.from}</strong> {task.title.title}
        </>
      )
    }
    default: {
      return (
        <>
          <strong>{task.from ?? ''}</strong> {task.title.title ?? ''}
        </>
      )
    }
  }
}

export const generateSteps = (activeCase: Case): StepsType[] => {
  const statusIndex = caseStatusToIndex[activeCase.status.title]
  const displayTypes = [
    CaseCommentTypeTitleEnum.Submit,
    CaseCommentTypeTitleEnum.Assign,
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
            c.status.title === CaseStatusTitleEnum.Innsent &&
            displayTypes.includes(c.type.title),
        )
        ?.map(({ task, status }) => commentTaskToNode(task, status.title)),
    },
    {
      step: 'grunnvinnsla',
      title: 'Grunnvinnsla',
      isActive: statusIndex === 1,
      isComplete: statusIndex > 1,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.status.title === CaseStatusTitleEnum.Grunnvinnsla &&
            displayTypes.includes(c.type.title),
        )
        ?.map(({ task, status }) => commentTaskToNode(task, status.title)),
    },
    {
      step: 'yfirlestur',
      title: 'Yfirlestur',
      isActive: statusIndex === 2,
      isComplete: statusIndex > 2,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.status.title === CaseStatusTitleEnum.Yfirlestur &&
            displayTypes.includes(c.type.title),
        )
        ?.map(({ task, status }) => commentTaskToNode(task, status.title)),
    },
    {
      step: 'tilbuid',
      title: 'Tilbúið til útgáfu',
      isActive: statusIndex === 3,
      isComplete: statusIndex > 3,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.status.title === CaseStatusTitleEnum.Tilbi &&
            displayTypes.includes(c.type.title),
        )
        ?.map(({ task, status }) => commentTaskToNode(task, status.title)),
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
