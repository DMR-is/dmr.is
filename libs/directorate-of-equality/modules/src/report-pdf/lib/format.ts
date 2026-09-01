import { GenderEnum } from '../../report/models/report.enums'

/** Pure formatting/escaping helpers shared by the PDF templates. */

/**
 * is-IS number formatting: `.` groups thousands, `,` separates the decimal.
 *
 * ⚠️ **Substitutes by part TYPE, not by character.** `Intl.NumberFormat('is-IS')`
 * gets both separators right on a full-ICU Node — every Node 18+ default build,
 * this repo's image included. On a small-icu build `is-IS` is unavailable and
 * resolves to en-US, which inverts them, and that is what the blanket
 * `.replaceAll(',', '.')` this replaces was guarding against.
 *
 * It guarded the grouping and corrupted the decimal. In is-IS the `,` it
 * replaced IS the decimal separator, so `420,5` came out `420.5` and `1.234,56`
 * came out `1.234.56` — two grouping dots and no decimal at all. Invisible to
 * the specs, which pin only integers, and live wherever a fractional figure
 * prints: `score` is `DECIMAL(6,2)`, and the FTE counts are fractional by
 * definition.
 *
 * `formatToParts` names each separator, so this is correct under either ICU
 * build.
 */
const formatIsIs = (value: number): string =>
  new Intl.NumberFormat('is-IS')
    .formatToParts(value)
    .map((part) =>
      part.type === 'group' ? '.' : part.type === 'decimal' ? ',' : part.value,
    )
    .join('')

/** is-IS thousands formatting with a dot separator (e.g. 1.065.400). */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${formatIsIs(Math.round(value))} kr.`
}

/**
 * Reglulegt tímakaup, with the unit attached — `5.980 kr./klst.`
 *
 * Every pay figure in a salary report is now an hourly rate, and a bare
 * `4.884` next to a label like "Meðallaun karla" reads as a monthly salary two
 * orders of magnitude too low. The unit is not decoration: it is the only thing
 * distinguishing a plausible hourly rate from an implausible monthly one.
 *
 * Rounded to whole krónur for display only — the stored figure keeps 2dp.
 */
export function formatHourlyRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${formatIsIs(Math.round(value))} kr./klst.`
}

/**
 * A plain number with is-IS grouping and no currency suffix.
 *
 * Not rounded, unlike `formatCurrency` and `formatHourlyRate`: this is the one
 * helper that prints fractions — `Stig` is `DECIMAL(6,2)` and the FTE counts are
 * fractional — which is why it was the one the old separator munging broke.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return formatIsIs(value)
}

/** Signed percent with one decimal (e.g. +6,3% / -12,0%). */
export function formatPercent(
  value: number | null | undefined,
  { signed = false } = {},
): string {
  if (value === null || value === undefined) return '—'
  const formatted = value.toFixed(1).replace('.', ',')
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${formatted}%`
}

/** `YYYY-MM-DD`, the `DATEONLY` wire format — a calendar date, not an instant. */
const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * dd.MM.yyyy, matching the admin overview (e.g. 21.05.2026).
 *
 * A `YYYY-MM-DD` string is split rather than parsed. Such a string parses as
 * UTC midnight, and the `getDate()`/`getMonth()` below read LOCAL parts off
 * that instant — so the previous day renders for any viewer west of UTC.
 * Iceland is UTC+0 year-round, which is precisely why the shift would ship
 * unnoticed. `report_outlier_group.remedy_date` is `DATEONLY` and reaches this
 * function once the úrbótaáætlun section renders per group. The local-parts
 * path is correct only for a real instant (`report.correction_deadline`, a
 * `DataType.DATE`), so keep it for `Date` values and strings carrying a time.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  if (typeof value === 'string') {
    const dateOnly = ISO_DATE_ONLY.exec(value.trim())
    if (dateOnly) {
      const [, year, month, day] = dateOnly
      return `${day}.${month}.${year}`
    }
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

export function genderLabel(gender: GenderEnum | null | undefined): string {
  switch (gender) {
    case GenderEnum.MALE:
      return 'Karl'
    case GenderEnum.FEMALE:
      return 'Kona'
    case GenderEnum.NEUTRAL:
      return 'Hlutlaust'
    default:
      return '—'
  }
}

/** Escapes text destined for HTML element content / attribute values. */
export function escapeHtml(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Falls back to an em dash for empty/missing values. */
export function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? escapeHtml(trimmed) : '—'
}

const IS_MONTHS = [
  'janúar',
  'febrúar',
  'mars',
  'apríl',
  'maí',
  'júní',
  'júlí',
  'ágúst',
  'september',
  'október',
  'nóvember',
  'desember',
]

/**
 * `YYYY-MM-01` as "maí 2026", mirroring the admin's `formatMonthYearIS`.
 *
 * ⚠️ Splits the string rather than constructing a `Date`. The value is a
 * calendar month, and `new Date('2026-05-01').getMonth()` returns April for any
 * viewer west of UTC — the same class of bug `formatIsoDate` exists to avoid.
 */
export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month] = value.split('-')
  const name = IS_MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : value
}
