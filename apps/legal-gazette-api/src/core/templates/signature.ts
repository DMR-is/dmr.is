import { isDefined, isEmpty } from 'class-validator'

import { formatDate } from '@dmr.is/utils-server/serverUtils'

import { getElement } from './element'

function formatDateAndLocation(location?: string | null, date?: Date | null) {
  if (!isEmpty(location) && isDefined(date)) {
    return `${location}, ${formatDate(date, 'd. MMMM yyyy')}`
  }

  if (!isEmpty(location)) {
    return `${location}`
  }

  if (isDefined(date)) {
    return `${formatDate(date, 'd. MMMM yyyy')}`
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
  const onBehalfOfMarkup = !isEmpty(onBehalfOf)
    ? getElement(`f.h. ${onBehalfOf}`)
    : ''
  const nameMarkup = !isEmpty(name)
    ? getElement(`<strong>${name}</strong>`, {
        className: 'advertSignatureName',
      })
    : ''

  return `
    <div class="advertSignature">
      ${locationMarkup}
      ${onBehalfOfMarkup}
      ${nameMarkup}
    </div>
  `
}
