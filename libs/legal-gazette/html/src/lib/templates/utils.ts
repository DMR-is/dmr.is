import { isNotEmpty, isString } from 'class-validator'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { atReykjavik } from '@dmr.is/utils-shared/date/calendarDate'

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

/**
 * Alias kept for the ten template modules that import it; `formatDate` already
 * returns the empty tuple for anything that is not a Date or a parseable string.
 */
export const parseAndFormatDate = (date?: unknown): [string, string, string] =>
  formatDate(date)

export const getStatementLocation = (settlement?: BaseSettlement) => {
  switch (settlement?.statementType) {
    case 'email':
      return settlement?.customLiquidatorLocation || ''
    case 'custom':
      return settlement?.customLiquidatorLocation || ''
    case 'location':
    default:
      return settlement?.liquidatorLocation || ''
  }
}

export const getStatementPrefix = (settlement?: BaseSettlement) => {
  if (settlement?.statementType === 'email') {
    return 'með rafrænum hætti á netfangið '
  }
  return 'að '
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
  const parsedDate =
    date instanceof Date
      ? date
      : typeof date === 'string'
        ? new Date(date)
        : undefined

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return ['', '', '']
  }

  // date-fns formats in the process timezone - the API container for a
  // published advert, the reader's browser for a preview - which made the same
  // stored instant render as two different calendar days.
  const reykjavikDate = atReykjavik(parsedDate)

  return [
    format(reykjavikDate, 'd. MMMM yyyy', { locale: is }),
    getPossesiveDay(format(reykjavikDate, 'EEEE', { locale: is })),
    format(reykjavikDate, "'kl.' HH:mm", { locale: is }),
  ]
}

export const getPossesiveDay = (day: string) => {
  const found = ICELANDIC_WEEKDAYS_POSSESIVE_MAP[day]

  if (found === undefined) {
    return day
  }

  return found
}
