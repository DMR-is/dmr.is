import { GenderEnum } from '../../report/models/report.enums'

/** Pure formatting/escaping helpers shared by the PDF templates. */

/** is-IS thousands formatting with a dot separator (e.g. 1.065.400). */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${new Intl.NumberFormat('is-IS')
    .format(Math.round(value))
    .replaceAll(',', '.')} kr.`
}

/** Plain integer with is-IS grouping (no currency suffix). */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('is-IS')
    .format(value)
    .replaceAll(',', '.')
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

/** dd.MM.yyyy, matching the admin overview (e.g. 21.05.2026). */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
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
