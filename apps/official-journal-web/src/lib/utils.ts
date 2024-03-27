import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { GetEditorialOverviewStatusEnum } from '../gen/fetch'
import { CaseOverviewTabIds, FALLBACK_DOMAIN, JSON_ENDING } from './constants'
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
