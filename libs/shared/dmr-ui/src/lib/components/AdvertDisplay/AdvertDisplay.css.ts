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

globalStyle(`.advertContent table `, {
  tableLayout: 'fixed',
})
globalStyle(`.advertContent table td, .advertContent table th`, {
  border: 'none',
  paddingRight: '1em',
})

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

export const legacyText = style({
  fontWeight: '300',
})
globalStyle(`${legacyText} p, div`, {
  fontWeight: '300',
  fontSize: '10pt',
  marginBottom: '.5em',
  lineHeight: '1.35em',
})
globalStyle(`${legacyText} .advertText p, div `, {
  fontSize: '1em',
})
globalStyle(`${legacyText} .advertText td`, {
  padding: '.125em .33em .125em 0',
})
globalStyle(`${legacyText} strong, b`, {
  fontWeight: 'bold',
})
globalStyle(`${legacyText} .advertType`, {
  fontSize: '1.2em',
  fontWeight: 'bold',
})
globalStyle(`${legacyText} .advertType > td`, {
  paddingBottom: '4px',
})
globalStyle(`.advertText table `, {
  tableLayout: 'fixed',
  width: '100%',
})
