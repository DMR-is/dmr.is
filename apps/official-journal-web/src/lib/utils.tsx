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
  CaseProcessingTabIds,
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

export const mapQueryParamToCaseProcessingTab = (param?: unknown) => {
  switch (param) {
    case CaseProcessingTabIds.Submitted:
      return CaseProcessingTabIds.Submitted
    case CaseProcessingTabIds.InProgress:
      return CaseProcessingTabIds.InProgress
    case CaseProcessingTabIds.InReview:
      return CaseProcessingTabIds.InReview
    case CaseProcessingTabIds.Ready:
      return CaseProcessingTabIds.Ready
    default:
      return CaseProcessingTabIds.Submitted
  }
}

export const mapTabIdToCaseStatus = (param?: unknown) => {
  switch (param) {
    case CaseProcessingTabIds.Submitted:
      return GetEditorialOverviewStatusEnum.Innsent
    case CaseProcessingTabIds.InProgress:
      return GetEditorialOverviewStatusEnum.Grunnvinnsla
    case CaseProcessingTabIds.InReview:
      return GetEditorialOverviewStatusEnum.Yfirlestur
    case CaseProcessingTabIds.Ready:
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

const caseStatusToIndex: Record<CaseStatusEnum, number> = {
  [CaseStatusEnum.Innsent]: 0,
  [CaseStatusEnum.Grunnvinnsla]: 1,
  [CaseStatusEnum.Yfirlestur]: 2,
  [CaseStatusEnum.Tilbi]: 3,
  [CaseStatusEnum.BeiSvara]: 4,
  [CaseStatusEnum.BirtinguHafna]: 5,
}
type StepsType = {
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
