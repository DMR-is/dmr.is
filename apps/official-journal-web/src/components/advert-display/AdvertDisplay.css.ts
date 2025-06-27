import { theme } from '@island.is/island-ui/theme'
import {
  regulationContentStyling,
  regulationTitleStyling,
} from '@island.is/regulations/styling'

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

export const wrapper = style({
  position: 'relative',
  overflowY: 'auto',
})
