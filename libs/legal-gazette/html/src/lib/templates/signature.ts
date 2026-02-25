import { isDefined, isEmpty } from 'class-validator'

import { SignatureMarkupProps } from './types'
import { getElement, parseAndFormatDate } from './utils'

export const getSignatureMarkup = ({
  name = '',
  onBehalfOf = '',
  location = '',
  date = '',
}: SignatureMarkupProps) => {
  if (!isDefined(name) && !isDefined(location) && !isDefined(date)) {
    return ''
  }

  const [formattedDate] = parseAndFormatDate(date)
  const dateAndLocation = [location, formattedDate]
    .filter(Boolean)
    .join(', ')

  const locationMarkup = !isEmpty(dateAndLocation)
    ? getElement({ text: dateAndLocation })
    : ''

  const onBehalfOfMarkup = !isEmpty(onBehalfOf)
    ? getElement({ text: `f.h. ${onBehalfOf}` })
    : ''

  const nameInner = !isEmpty(name)
    ? getElement({ text: name, options: { as: 'strong' } })
    : ''

  const nameOuter = !isEmpty(nameInner)
    ? getElement({
        text: nameInner,
        options: { className: 'advertSignatureName' },
      })
    : ''

  const markup = [locationMarkup, onBehalfOfMarkup, nameOuter]
    .filter(Boolean)
    .join(' ')

  if (isEmpty(markup)) {
    return ''
  }

  const signature = getElement({
    text: markup,
    options: { as: 'div', className: 'advertSignature' },
  })

  return signature
}
