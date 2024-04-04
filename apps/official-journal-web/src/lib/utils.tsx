import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import {
  Case,
  CaseComment,
  CaseCommentCaseStatusEnum,
  CaseCommentTypeEnum,
  CaseStatusEnum,
  GetEditorialOverviewStatusEnum,
} from '../gen/fetch'
import {
  CaseDepartmentTabs,
  CaseOverviewTabIds,
  FALLBACK_DOMAIN,
  JSON_ENDING,
} from './constants'
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

export const mapQueryParamToCaseOverviewTab = (param?: unknown) => {
  switch (param) {
    case CaseOverviewTabIds.Submitted:
      return CaseOverviewTabIds.Submitted
    case CaseOverviewTabIds.InProgress:
      return CaseOverviewTabIds.InProgress
    case CaseOverviewTabIds.InReview:
      return CaseOverviewTabIds.InReview
    case CaseOverviewTabIds.Ready:
      return CaseOverviewTabIds.Ready
    default:
      return CaseOverviewTabIds.Submitted
  }
}

export const mapTabIdToCaseStatus = (param?: unknown) => {
  switch (param) {
    case CaseOverviewTabIds.Submitted:
      return GetEditorialOverviewStatusEnum.Innsent
    case CaseOverviewTabIds.InProgress:
      return GetEditorialOverviewStatusEnum.Grunnvinnsla
    case CaseOverviewTabIds.InReview:
      return GetEditorialOverviewStatusEnum.Yfirlestur
    case CaseOverviewTabIds.Ready:
      return GetEditorialOverviewStatusEnum.Tilbi
    default:
      return GetEditorialOverviewStatusEnum.Innsent
  }
}

export const mapTabIdToCaseDepartment = (param?: unknown) => {
  switch (param) {
    case CaseDepartmentTabs.A:
      return CaseDepartmentTabs.A
    case CaseDepartmentTabs.B:
      return CaseDepartmentTabs.B
    case CaseDepartmentTabs.C:
      return CaseDepartmentTabs.C
    default:
      return 'A'
  }
}

export const mapQueryParamToCaseDepartment = (param?: unknown) => {
  switch (param) {
    case CaseDepartmentTabs.A:
      return 'A-deild'
    case CaseDepartmentTabs.B:
      return 'B-deild'
    case CaseDepartmentTabs.C:
      return 'C-deild'
    default:
      return 'A-deild'
  }
}

export type CaseTableItem = {
  id: string
  labels: string[]
  publicationDate: string
  registrationDate: string
  department: string
  title: string
  employee?: string
  tag?: string
  institution?: string
  status: CaseStatusEnum
}

const caseStatusToIndex: Record<CaseStatusEnum, number> = {
  [CaseStatusEnum.Innsent]: 0,
  [CaseStatusEnum.Grunnvinnsla]: 1,
  [CaseStatusEnum.Yfirlestur]: 2,
  [CaseStatusEnum.Tilbi]: 3,
  [CaseStatusEnum.BeiSvara]: 4,
  [CaseStatusEnum.BirtinguHafna]: 5,
}

export type CaseStep = 'innsending' | 'grunnvinnsla' | 'yfirlestur' | 'tilbuid'
export const caseSteps: Array<CaseStep> = [
  'innsending',
  'grunnvinnsla',
  'yfirlestur',
  'tilbuid',
]

export const caseStatusMap: Record<CaseStatusEnum, CaseStep> = {
  [CaseStatusEnum.Innsent]: 'innsending',
  [CaseStatusEnum.Grunnvinnsla]: 'grunnvinnsla',
  [CaseStatusEnum.Yfirlestur]: 'yfirlestur',
  [CaseStatusEnum.Tilbi]: 'tilbuid',
  [CaseStatusEnum.BeiSvara]: 'tilbuid',
  [CaseStatusEnum.BirtinguHafna]: 'tilbuid',
}

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

export const generateSteps = (activeCase: Case): StepsType[] => {
  const statusIndex = caseStatusToIndex[activeCase.status]
  const displayTypes = [CaseCommentTypeEnum.Submit, CaseCommentTypeEnum.Assign]
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
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
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
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
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
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
    },
    {
      step: 'tilbuid',
      title: 'Tilbúið til útgáfu',
      isActive: statusIndex === 3,
      isComplete: statusIndex > 3,
      notes: activeCase.comments
        .filter(
          (c) =>
            c.caseStatus === CaseCommentCaseStatusEnum.Tilbi &&
            displayTypes.includes(c.type),
        )
        ?.map(({ task }) => commentTaskToNode(task)),
    },
  ]
}
