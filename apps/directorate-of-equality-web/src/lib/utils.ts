import { CompanySizeEnum } from '../gen/fetch'
import { sharedText } from './text'

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export const getBaseUrlFromServerSide = (includePrefix = false): string => {
  const url = process.env.BASE_URL!
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
 * Renders a config-stored percentage ("3.9") the Icelandic way ("3,9"). Config
 * values arrive as free-form strings, so anything non-numeric is passed through
 * untouched — a malformed entry stays visible instead of rendering as "NaN".
 */
export const formatPercentValue = (value: string) => {
  const parsed = Number(value.trim())

  return value.trim() === '' || !Number.isFinite(parsed)
    ? value
    : new Intl.NumberFormat('is-IS', { maximumFractionDigits: 2 }).format(
        parsed,
      )
}

/**
 * Parses a percentage typed by a user, accepting the Icelandic decimal comma.
 * Returns null when the input is not a usable positive number.
 *
 * Deliberately stricter than `Number`: the shape mirrors the API's own
 * `THRESHOLD_VALUE_PATTERN`, so the client rejects the same inputs the server
 * would rather than accepting `"1e0"` or `"0x2"` and failing on submit. The
 * two-decimal cap is what keeps the confirmation step honest — `formatPercentValue`
 * renders at most two decimals, so a value like `3,999` would otherwise be
 * confirmed as "úr 4% í 4%" and saved as something else.
 */
const PERCENT_INPUT_PATTERN = /^\d+([.,]\d{1,2})?$/

export const parsePercentInput = (value: string): number | null => {
  const trimmed = value.trim()

  if (!PERCENT_INPUT_PATTERN.test(trimmed)) return null

  const parsed = Number(trimmed.replace(',', '.'))

  return parsed > 0 ? parsed : null
}

/**
 * Reads the active config-stored percentage, returning null when the row is not
 * a usable number. Mirrors `ConfigService.assertThresholdIsLowered` exactly —
 * `Number`, not the laxer `parseFloat` the analysis readers use — so that a
 * hand-edited row like `"3,9"` reads as broken on both sides rather than being
 * compared against `3` here and rejected by the API on submit.
 *
 * Callers must treat null as "cannot be compared against", not as "no
 * constraint": the API refuses the update outright in that state.
 */
export const parseStoredPercent = (value: string): number | null => {
  const parsed = Number(value.trim())

  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : null
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
    sharedText.statusLabels[status as keyof typeof sharedText.statusLabels] ??
    status
  )
}

export const COMPANY_SIZE_LABEL: Record<CompanySizeEnum, string> = {
  [CompanySizeEnum.UNKNOWN]: 'Óþekkt',
  [CompanySizeEnum.SMALL]: '0–24',
  [CompanySizeEnum.MEDIUM]: '25–49',
  [CompanySizeEnum.LARGE]: '50+',
}
