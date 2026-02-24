import { theme } from '@dmr.is/island-ui-theme'
import {
  regulationContentStyling,
  regulationTitleStyling,
} from '@dmr.is/island-regulations/styling'

import { globalStyle, style } from '@vanilla-extract/css'

export const bodyText = style({})
regulationContentStyling(bodyText)
regulationTitleStyling(bodyText)

export const departmentDate = style({
  marginTop: '3.5em',
  textAlign: 'center',
})

export const modalBackground = style({
  height: '100vh',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  rowGap: theme.spacing[2],
  padding: theme.spacing[2],
  backgroundColor: `${theme.color.blue100}00`,
})

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

export const advertSignature = style({})
globalStyle(`${advertSignature} .signature__date`, {
  display: 'none',
})

export const wrapper = style({
  position: 'relative',
  overflowY: 'auto',
})
