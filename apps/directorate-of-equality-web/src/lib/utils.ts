import { CompanySizeEnum } from '../gen/fetch'
import { reportText, sharedText } from './text'

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export const getBaseUrlFromServerSide = (includePrefix = false): string => {
  let url = ''
  if (process.env.NODE_ENV === 'development') {
    url = process.env.DOE_WEB_URL!
  } else {
    url = (process.env.BASE_URL ?? process.env.IDENTITY_SERVER_LOGOUT_URL)!
  }
  return includePrefix ? url : url.replace(/^https?:\/\//, '')
}

export const formatNationalId = (nationalId = '') => {
  // Format: XXXXXX-XXXX or XXXXXXXXXX or XXXXXX XXXX
  const cleaned = nationalId.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) {
    return nationalId // Return as is if not 10 digits
  }
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`
}

export const mapGender = (gender?: string) => {
  switch (gender) {
    case 'FEMALE':
      return 'Kona'
    case 'MALE':
      return 'Karl'
    case 'NEUTRAL':
      return 'Hlutlaus skráning kyns í Þjóðskrá'
    default:
      return 'Óþekkt'
  }
}

export const EMPLOYEE_RANGES = [
  { value: CompanySizeEnum.SMALL, label: '0–24' },
  { value: CompanySizeEnum.MEDIUM, label: '25–49' },
  { value: CompanySizeEnum.LARGE, label: '50+' },
  { value: CompanySizeEnum.UNKNOWN, label: 'Óþekkt' },
]

export const formatSalary = (v: number) =>
  new Intl.NumberFormat('is-IS').format(Math.round(v)).replaceAll(',', '.')

/**
 * A pay rate with its unit attached. Always prefer this to bare `formatSalary`
 * for tímakaup: `4.884` under a label like "Meðallaun" reads as a monthly salary
 * two orders of magnitude too low, and nothing on the page corrects the
 * impression. Mirrors the API's `formatHourlyRate` in
 * `report-pdf/lib/format.ts` so the web and the PDF cannot drift.
 */
export const formatHourlyRate = (v: number | null | undefined) =>
  v == null ? '—' : `${formatSalary(v)} ${reportText.salaryTab.hourlyUnit}`

/**
 * A percentage to one decimal, or an em dash when not computable. `signed` adds
 * an explicit `+` to positives; negatives always carry their own minus.
 *
 * Mirrors the API's `formatPercent` in `report-pdf/lib/format.ts`
 * character-for-character — same decimal count, same comma, same ASCII sign — so
 * the PDF and the web cannot print two different renderings of one number.
 */
export const formatPercent = (
  v: number | null | undefined,
  { signed = false }: { signed?: boolean } = {},
) => {
  if (v == null) return '—'
  const formatted = v.toFixed(1).replace('.', ',')
  const sign = signed && v > 0 ? '+' : ''
  return `${sign}${formatted}%`
}

/**
 * Matches the API's 409 message "Company already has a <TYPE> report in
 * status <STATUS> (providerId: ...). Resolve it before submitting another."
 * and returns the localized status label, or null for any other message.
 */
export const parseInflightConflictStatus = (message: string): string | null => {
  const match = message.match(/already has a \w+ report in status (\w+)/i)
  if (!match) return null
  const status = match[1].toUpperCase()
  return (
    sharedText.statusLabels[
      status as keyof typeof sharedText.statusLabels
    ] ?? status
  )
}

export const COMPANY_SIZE_LABEL: Record<CompanySizeEnum, string> = {
  [CompanySizeEnum.UNKNOWN]: 'Óþekkt',
  [CompanySizeEnum.SMALL]: '0–24',
  [CompanySizeEnum.MEDIUM]: '25–49',
  [CompanySizeEnum.LARGE]: '50+',
}
