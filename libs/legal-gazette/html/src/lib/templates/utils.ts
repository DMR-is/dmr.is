import { isDefined, isNotEmpty, isString } from 'class-validator'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'

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
}: GetElementProps): string =>
  {
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
      format(date, 'EEEE', { locale: is }),
      format(date, "'kl.' HH:mm", { locale: is }),
    ]
  }
  if (typeof date === 'string') {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) {
      return [
        format(parsedDate, 'd. MMMM yyyy', { locale: is }),
        format(parsedDate, 'EEEE', { locale: is }),
        format(parsedDate, "'kl.' HH:mm", { locale: is }),
      ]
    }
  }

  return ['', '', '']
}
