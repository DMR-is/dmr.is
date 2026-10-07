import {
  regulationContentStyling,
  regulationTitleStyling,
} from '@dmr.is/island-regulations/styling'
import { theme } from '@dmr.is/island-ui-theme'

import { globalStyle, style } from '@vanilla-extract/css'

export const modal = style({
  height: '100vh',
  display: 'grid',
  gridTemplateRows: 'auto auto 1fr',
  rowGap: theme.spacing[2],
  padding: theme.spacing[3],
  backgroundColor: theme.color.white,
})

export const results = style({
  overflowY: 'auto',
})

export const resultButton = style({
  width: '100%',
  textAlign: 'left',
})

export const content = style({
  position: 'relative',
  overflowY: 'auto',
})

// Diff marks come from @dmr.is/regulations-tools/diff.css, deliberately not
// from diffStyling: that colours every `ins` as added text, including `ins.mod`
// (formatting changed, text did not).
export const bodyText = style({})
regulationContentStyling(bodyText)
regulationTitleStyling(bodyText)

globalStyle(
  `
    ${bodyText} .section__title em,
    ${bodyText} .section__title i,
    ${bodyText} .chapter__title em,
    ${bodyText} .chapter__title i,
    ${bodyText} .subchapter__title em,
    ${bodyText} .subchapter__title i,
    ${bodyText} .article__title em,
    ${bodyText} .article__title i`,
  {
    display: 'block',
  },
)
