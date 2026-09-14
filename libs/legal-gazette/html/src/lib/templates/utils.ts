import { isDefined, isNotEmpty, isString } from 'class-validator'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { ICELANDIC_WEEKDAYS_POSSESIVE_MAP } from '../constants'
import { BaseSettlement } from './types'

type GetElementOptions = {
  as?: keyof HTMLElementTagNameMap
  className?: string
}

type GetElementProps = {
  text?: string | null
  options?: GetElementOptions
}

export const getElement = ({
  text = '',
  options = { as: 'p', className: '' },
}: GetElementProps): string => {
  // must use this fallback, if options are passed wihout as, it should default to 'p'
  const tag = options.as || 'p'
  return `<${tag}${isString(options.className) ? ` class="${options.className}"` : ''}>${text}</${tag}>`
}

export function getTableHeaderCell(text: string): string {
  const strongElement = getElement({ text, options: { as: 'strong' } })
  const tableHeader = getElement({ text: strongElement, options: { as: 'td' } })

  return tableHeader
}

type GetTableCellOptions = {
  heading?: string
  italic?: boolean
  bold?: boolean
}

type GetTableCellProps = {
  text?: string
  options?: GetTableCellOptions
}

export function getTableCell({
  text = '',
  options = { heading: '', italic: false, bold: false },
}: GetTableCellProps): string {
  let headingText = options.heading
  if (options.italic)
    headingText = getElement({ text: headingText, options: { as: 'i' } })
  if (options.bold)
    headingText = getElement({ text: headingText, options: { as: 'strong' } })
  const inner = isNotEmpty(headingText) ? `${headingText} ${text}` : text
  return getElement({ text: inner, options: { as: 'td' } })
}

export const parseAndFormatDate = (
  date?: unknown,
): [string, string, string] => {
  if (!isDefined(date)) return ['', '', '']
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return ['', '', '']
    }
    return formatDate(date)
  }
  if (typeof date === 'string') {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) {
      return formatDate(parsedDate)
    }
  }

  return ['', '', '']
}

export const getStatementLocation = (settlement?: BaseSettlement) => {
  switch (settlement?.statementType) {
    case 'email':
    case 'custom':
    case 'url':
    case 'other':
      return settlement?.customLiquidatorLocation || ''
    case 'location':
    default:
      return settlement?.liquidatorLocation || ''
  }
}

export const escapeHtml = (value?: string | null): string =>
  (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * The href for a liquidator-supplied web address, or null when it cannot be
 * turned into a safe one. Only http(s) is allowed: the advert HTML is rendered
 * through dangerouslySetInnerHTML, so a "javascript:" value would execute.
 * A bare host such as "krofur.is/123" is assumed to be https, because that is
 * what people type, but the advert still displays exactly what they entered.
 */
export const getStatementUrlHref = (value?: string | null): string | null => {
  const trimmed = (value ?? '').trim()
  if (!trimmed || /\s/.test(trimmed)) return null

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

/**
 * The destination as it appears in the advert body, already HTML.
 *
 * Every branch is escaped. The value is free text typed by the liquidator and
 * the advert is rendered through dangerouslySetInnerHTML, so an unescaped
 * destination is script execution in the preview and on the public web. Only
 * the "url" branch adds markup of its own, around the escaped value.
 */
export const getStatementDestination = (settlement?: BaseSettlement) => {
  const location = getStatementLocation(settlement)

  if (settlement?.statementType !== 'url') {
    return escapeHtml(location)
  }

  const href = getStatementUrlHref(location)

  return href
    ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(location)}</a>`
    : escapeHtml(location)
}

/**
 * Sentence fragment placed between "Kröfulýsingar skulu sendar skiptastjóra" and the
 * destination. The location branches deliberately return an empty prefix: the
 * destination is free text supplied by the liquidator, so a hardcoded "að"
 * cannot be relied on to agree with its case.
 */
export const getStatementPrefix = (settlement?: BaseSettlement) => {
  switch (settlement?.statementType) {
    case 'email':
      return 'með rafrænum hætti á netfangið '
    case 'url':
      return 'með rafrænum hætti á vefsvæðinu '
    case 'custom':
    case 'location':
    case 'other':
    default:
      return ''
  }
}

/**
 * Returns the court district title in "eignarfall" (genitive), which is the
 * case required by the templates that interpolate it, e.g.
 * "Með úrskurði Héraðsdóms Reykjavíkur uppkveðnum ...".
 *
 * Titles that do not start with "Héraðsdómur" are returned untouched.
 */
export const toPossessiveCourtDistrict = (title?: string | null) =>
  (title ?? '').replace(/^Héraðsdómur\b/, 'Héraðsdóms')

export const formatNationalId = (nationalId = '') => {
  // Format: XXXXXX-XXXX or XXXXXXXXXX or XXXXXX XXXX
  const cleaned = nationalId.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) {
    return nationalId // Return as is if not 10 digits
  }
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`
}

/**
 *
 * @param date
 * @returns [fully formatted date, weekday, time]
 */
export const formatDate = (date: unknown): [string, string, string] => {
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return ['', '', '']
    }
    return [
      format(date, 'd. MMMM yyyy', { locale: is }),
      getPossesiveDay(format(date, 'EEEE', { locale: is })),
      format(date, "'kl.' HH:mm", { locale: is }),
    ]
  }
  if (typeof date === 'string') {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) {
      return [
        format(parsedDate, 'd. MMMM yyyy', { locale: is }),
        getPossesiveDay(format(parsedDate, 'EEEE', { locale: is })),
        format(parsedDate, "'kl.' HH:mm", { locale: is }),
      ]
    }
  }

  return ['', '', '']
}

export const getPossesiveDay = (day: string) => {
  const found = ICELANDIC_WEEKDAYS_POSSESIVE_MAP[day]

  if (found === undefined) {
    return day
  }

  return found
}
