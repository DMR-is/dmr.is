import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { ParsedUrlQuery } from 'querystring'

import { StringOption } from '@island.is/island-ui/core'
import { isDefined } from '@island.is/shared/utils'

import {
  Application,
  Case,
  CaseComment,
  CaseCommentCaseStatusEnum,
  CaseCommentTypeEnum,
  CaseStatusEnum,
  CaseTagEnum,
  CaseWithApplication,
  CaseWithApplicationCaseStatusEnum,
  GetCasesRequest,
  GetEditorialOverviewStatusEnum,
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

export const handleFilterToggle = (
  qp: ReturnType<typeof useQueryParams>,
  toggle: boolean,
  key: string,
  value: string,
) => {
  const existingValue = qp.get(key)
  if (existingValue && toggle) {
    qp.add({ [key]: `${existingValue},${value}` })
  } else if (existingValue && !toggle) {
    const newValue = existingValue
      .split(',')
      .filter((v) => v !== value)
      .join(',')
    if (newValue) {
      qp.add({ [key]: newValue })
    } else {
      qp.remove([key])
    }
  } else if (toggle) {
    qp.add({ [key]: value })
  } else {
    qp.remove([key])
  }
}

export const mapTabIdToCaseStatus = (param?: string) => {
  switch (param) {
    case CaseStatusEnum.Innsent:
      return GetEditorialOverviewStatusEnum.Innsent
    case CaseStatusEnum.Grunnvinnsla:
      return GetEditorialOverviewStatusEnum.Grunnvinnsla
    case CaseStatusEnum.Yfirlestur:
      return GetEditorialOverviewStatusEnum.Yfirlestur
    case CaseStatusEnum.Tilbi:
      return GetEditorialOverviewStatusEnum.Tilbi
    default:
      return GetEditorialOverviewStatusEnum.Tilbi
  }
}

export const enumToOptions = (
  obj: typeof CaseStatusEnum | typeof CaseTagEnum,
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

export const generateCaseLink = (
  status: CaseStatusEnum | CaseWithApplicationCaseStatusEnum,
  caseId: string,
) => {
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

export const commentTaskToNode = (task: CaseComment['task']) => {
  return (
    <>
      {task.from ? <strong>{task.from}</strong> : null}{' '}
      {task.title ? task.title : null}{' '}
      {task.to ? <strong>{task.to}</strong> : null}{' '}
    </>
  )
}

export const generateSteps = (activeCase: CaseWithApplication): StepsType[] => {
  const statusIndex = caseStatusToIndex[activeCase.caseStatus]
  const displayTypes = [CaseCommentTypeEnum.Submit, CaseCommentTypeEnum.Assign]
  return [
    {
      step: 'innsending',
      title: 'Innsending',
      isActive: statusIndex === 0,
      isComplete: statusIndex > 0,
      notes: activeCase.caseComments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Innsent &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
    },
    {
      step: 'grunnvinnsla',
      title: 'Grunnvinnsla',
      isActive: statusIndex === 1,
      isComplete: statusIndex > 1,
      notes: activeCase.caseComments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Grunnvinnsla &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
    },
    {
      step: 'yfirlestur',
      title: 'Yfirlestur',
      isActive: statusIndex === 2,
      isComplete: statusIndex > 2,
      notes: activeCase.caseComments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Yfirlestur &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
    },
    {
      step: 'tilbuid',
      title: 'Tilbúið til útgáfu',
      isActive: statusIndex === 3,
      isComplete: statusIndex > 3,
      notes: activeCase.caseComments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Tilbi &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
    },
  ]
}

export const extractCaseProcessingFilters = (
  query: ParsedUrlQuery,
): { filters: GetCasesRequest; tab: string } => {
  const values = Object.entries({
    ...query,
  })
    .filter((ent) => ent[0] !== 'tab')
    .filter(isDefined)

  return {
    filters: values.reduce(
      (acc, [key, value]) => ({ ...acc, [key]: value }),
      {},
    ),
    tab: query.tab as string,
  }
}
