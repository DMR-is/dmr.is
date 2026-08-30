import { CompanySizeEnum, type WageGapEmployeeDto } from '../gen/fetch'
import { reportText, sharedText } from './text'

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
 * A `DATEONLY` field off the API (`YYYY-MM-DD`) as `dd.mm.yyyy`.
 *
 * ⚠️ Splits the string rather than going through `new Date(...)`. An ISO
 * date-only string parses as UTC midnight, so `toLocaleDateString` renders the
 * PREVIOUS day for any viewer west of UTC — `2027-03-01` shows as 28.02.2027 in
 * New York. Iceland is UTC+0 year-round so the bug is invisible locally, which
 * is exactly why it survives. The value carries no time and no zone; treating
 * it as an instant is the mistake.
 *
 * Mirrors `formatDate` in the API's `report-pdf/lib/format.ts` — change both
 * together.
 */
export const formatIsoDate = (v: string | null | undefined) => {
  if (!v) return '—'
  const [year, month, day] = v.split('-')
  if (!year || !month || !day) return '—'
  return `${day}.${month}.${year}`
}

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
 * Which way a set of listed employees deviates from the fitted line.
 *
 * The úrbótaáætlun's explanation fields (`reason` / `action` / signature) live on
 * `report_outlier_group`, not on the per-employee join, and whoever builds the
 * groups composes them freely — so a group can legitimately contain someone paid
 * below their starfsmatsstig and someone paid above. `mixed` is therefore a real
 * third case, not a fallback.
 *
 * `ON_LINE` cannot be a member of the lágmarksmengi (a zero residual carries
 * none of the gap), so it is treated as absent rather than given a fourth
 * branch.
 */
export type DeviationDirection = 'below' | 'above' | 'mixed'

/**
 * ⚠️ Returns `undefined` when there is nothing to fold, and callers must render
 * no prompt at all in that case.
 *
 * `mixed` was the previous answer and is wrong: it asserts that the list spans
 * both sides of the line, which is a claim about data that is absent — the same
 * class of mistake as rendering 0% for a gap that is not computable. Both call
 * sites can reach it (a group whose ordinals no longer resolve against the
 * fetched rows; a report with no frozen decomposition), and only one of them used
 * to guard, so the guard belongs here where it cannot be forgotten.
 *
 * ⚠️ Typed off the DTO rather than as `string`. Through `string` these comparisons
 * still compile after the API renames an enum member, and every group would then
 * fall silently to the mixed prompt.
 */
export const foldDeviationDirection = (
  payStatuses: readonly (WageGapEmployeeDto['payStatus'] | null | undefined)[],
): DeviationDirection | undefined => {
  let below = false
  let above = false
  for (const status of payStatuses) {
    if (status === 'UNDERPAID') below = true
    else if (status === 'OVERPAID') above = true
  }
  if (below && !above) return 'below'
  if (above && !below) return 'above'
  return below && above ? 'mixed' : undefined
}

/**
 * A percentage to one decimal, or an em dash when not computable. `signed` adds
 * an explicit `+` to positives; negatives always carry their own minus.
 *
 * Mirrors the API's `formatPercent` in `report-pdf/lib/format.ts`
 * character-for-character — same decimal count, same comma, same ASCII sign — so
 * the PDF and the web cannot print two different renderings of one number.
 *
 * ⚠️ Not interchangeable with `formatPercentValue` below, which they sit beside:
 * this one renders a *computed* number for display, that one echoes a
 * *config-stored string* and deliberately passes malformed input through
 * untouched. Reaching for the wrong one turns a broken config row into a
 * confident `0,0%`.
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
