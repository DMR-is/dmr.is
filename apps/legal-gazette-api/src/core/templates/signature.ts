import { isDefined } from 'class-validator'

import { formatDate } from '@dmr.is/utils'

import { getElement } from './element'

function formatDateAndLocation(location?: string | null, date?: Date | null) {
  if (isDefined(location) && isDefined(date)) {
    return `${location}, ${formatDate(date, 'dd. MMMM yyyy')}`
  }

  if (isDefined(location)) {
    return `${location}`
  }

  if (isDefined(date)) {
    return `${formatDate(date, 'dd. MMMM yyyy')}`
  }

  return ''
}

export function getSignatureMarkup({
  name,
  onBehalfOf,
  location,
  date,
}: {
  name?: string | null
  onBehalfOf?: string | null
  location?: string | null
  date?: Date | null
}) {
  if (!isDefined(name) && !isDefined(location) && !isDefined(date)) {
    return ''
  }

  const locationMarkup = getElement(formatDateAndLocation(location, date))
  const onBehalfOfMarkup = getElement(`f.h. ${onBehalfOf}`)
  const nameMarkup = getElement(`<strong>${name}</strong>`, {
    className: 'advertSignatureName',
  })

  return `
    <div class="advertSignature">
      ${locationMarkup}
      ${onBehalfOfMarkup}
      ${nameMarkup}
    </div>
  `
}
