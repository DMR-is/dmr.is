import { isDefined, isNotEmpty, isString } from 'class-validator'

import { formatDate } from '@dmr.is/utils/server/serverUtils'

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
  `<${options.as}${isString(options.className) ? ` class="${options.className}"` : ''}>${text}</${options.as}>`

export function getTableHeaderCell(text: string): string {
  const strongElement = getElement({ text, options: { as: 'strong' } })
  const tableHeader = getElement({ text: strongElement, options: { as: 'th' } })

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

export const parseAndFormatDate = (date?: unknown): string => {
  if (!isDefined(date)) return ''
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return ''
    }
    return formatDate(date, 'd. MMMM yyyy')
  }
  if (typeof date === 'string') {
    const parsedDate = new Date(date)
    if (!isNaN(parsedDate.getTime())) {
      return formatDate(parsedDate, 'd. MMMM yyyy')
    }
  }

  return ''
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
