import { isDefined } from 'class-validator'

export function getElement(
  text?: string | null,
  options?: {
    as?: keyof HTMLElementTagNameMap
    className?: string
  },
) {
  if (!isDefined(text)) return ''

  const as = options?.as ?? 'p'
  const className = options?.className ?? ''

  return `<${as}${className ? ` class="${className}"` : ''}>${text}</${as}>`
}

export function getTableHeaderCell(text: string): string {
  return `<td><strong>${text}</strong></td>`
}

export function getTableCell(
  text: string,
  options?: { heading?: string; italic: boolean },
) {
  if (options?.italic && options.heading) {
    return `<td><i>${options.heading}</i> ${text}</></td>`
  }

  if (options?.italic) {
    return `<td><i>${text}</i></td>`
  }

  if (options?.heading) {
    return `<td><strong>${options.heading}</strong> ${text}</td>`
  }

  return `<td>${text}</td>`
}
