import {
  regulationContentStyling,
  regulationTitleStyling,
} from '@island.is/regulations/styling'

import { globalStyle, style } from '@vanilla-extract/css'

export const bodyText = style({})
regulationContentStyling(bodyText)
regulationTitleStyling(bodyText)

globalStyle(
  `
    .section__title em,
    .section__title i,
    .chapter__title em,
    .chapter__title i,
    .subchapter__title em,
    .subchapter__title i,
    .article__title em,
    .article__title i`,
  {
    display: 'block',
  },
)

globalStyle('.advert.legal-gazette .advert', {
  fontSize: '12pt',
})

globalStyle('.advert.legal-gazette .advertSerial', {
  fontSize: '10pt',
  textAlign: 'right',
  marginBlock: 0,
})

globalStyle('.advert.legal-gazette .advertHeading', {
  fontWeight: 'bold',
  marginBottom: '4px',
})

globalStyle('.advert.legal-gazette p', {
  textAlign: 'justify',
  marginBlock: '1em',
})

globalStyle('.advert.legal-gazette .advertSignature p', {
  textAlign: 'right',
  marginBlock: 0,
})
