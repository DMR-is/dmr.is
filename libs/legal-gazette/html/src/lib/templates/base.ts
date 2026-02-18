import { isEmpty, isNotEmpty } from 'class-validator'

import { AdvertTemplateType } from '../constants'
import { getDivisionEndingBankruptcyTemplate } from './division-ending-bankruptcy'
import { getDivisionEndingDeceasedTemplate } from './division-ending-deceased'
import { getDivisionMeetingBankruptcyTemplate } from './division-meeting-bankruptcy'
import { getDivisionMeetingDeceasedTemplate } from './division-meeting-deceased'
import { getForeclosureTemplate } from './foreclosure'
import { getRecallBankruptcyTemplate } from './recall-bankruptcy'
import { getRecallDeceasedTemplate } from './recall-deceased'
import { getSignatureMarkup } from './signature'
import {
  BaseTemplateProps,
  CommonTemplateProps,
  DivisionEndingTemplateProps,
  DivisionMeetingBankruptcyTemplateProps,
  DivisionMeetingDeceasedTemplateProps,
  ForeclosureTemplateProps,
  RecallBankruptcyTemplateProps,
  RecallDeceasedTemplateProps,
} from './types'
import { getElement, parseAndFormatDate } from './utils'

type HTMLMarkupProps =
  | (CommonTemplateProps & BaseTemplateProps)
  | (RecallBankruptcyTemplateProps & BaseTemplateProps)
  | (RecallDeceasedTemplateProps & BaseTemplateProps)
  | (ForeclosureTemplateProps & BaseTemplateProps)
  | (DivisionMeetingBankruptcyTemplateProps & BaseTemplateProps)
  | (DivisionMeetingDeceasedTemplateProps & BaseTemplateProps)
  | (DivisionEndingTemplateProps & BaseTemplateProps)

export const getAdvertHTMLMarkup = (props: HTMLMarkupProps) => {
  const {
    isPublished = false,
    publishDate,
    version = 'A',
    publicationNumber = `(Reiknast við útgáfu)${version}`,
    additionalText,
    title,
    signature,
  } = props
  const additionalMarkup = !isEmpty(additionalText)
    ? getElement({ text: additionalText })
    : ''

  const titleMarkup = !isEmpty(title)
    ? getElement({
        text: title,
        options: {
          as: 'h1',
          className: 'advertHeading',
        },
      })
    : ''

  const publicationMarkup = getElement({
    text: publicationNumber,
    options: {
      className: 'advertSerial',
    },
  })

  const publishingText = isPublished
    ? `Útgáfud.: ${parseAndFormatDate(publishDate)}`
    : `Áætlaður útgáfud.: ${parseAndFormatDate(publishDate)}`

  const publishingDateMarkup = !isEmpty(publishDate)
    ? getElement({
        text: publishingText,
        options: { className: 'advertSerial' },
      })
    : ''

  const signatureMarkup = getSignatureMarkup({ ...signature })

  let htmlContent = ''
  switch (props.templateType) {
    case AdvertTemplateType.COMMON: {
      htmlContent = props.content || ''
      break
    }
    case AdvertTemplateType.RECALL_BANKRUPTCY: {
      htmlContent = getRecallBankruptcyTemplate(props)
      break
    }
    case AdvertTemplateType.RECALL_DECEASED: {
      htmlContent = getRecallDeceasedTemplate(props)
      break
    }
    case AdvertTemplateType.FORECLOSURE: {
      htmlContent = getForeclosureTemplate(props)
      break
    }
    case AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY: {
      htmlContent = getDivisionMeetingBankruptcyTemplate(props)
      break
    }
    case AdvertTemplateType.DIVISION_MEETING_DECEASED: {
      htmlContent = getDivisionMeetingDeceasedTemplate(props)
      break
    }
    case AdvertTemplateType.DIVISION_ENDING_BANKRUPTCY: {
      htmlContent = getDivisionEndingBankruptcyTemplate(props)
      break
    }
    case AdvertTemplateType.DIVISION_ENDING_DECEASED: {
      htmlContent = getDivisionEndingDeceasedTemplate(props)
      break
    }
    default:
      htmlContent = ''
  }

  const advertContent = !isEmpty(htmlContent)
    ? getElement({
        text: htmlContent,
        options: {
          as: 'div',
          className: 'advertContent',
        },
      })
    : ''

  const markup = [
    publishingDateMarkup,
    titleMarkup,
    additionalMarkup,
    advertContent,
    signatureMarkup,
    publicationMarkup,
  ]
    .filter(isNotEmpty)
    .join('')

  const advertMarkup = getElement({
    text: markup,
    options: {
      as: 'div',
      className: 'advert legal-gazette',
    },
  })

  return advertMarkup
}
