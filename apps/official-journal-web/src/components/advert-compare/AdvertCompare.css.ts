import {
  regulationContentStyling,
  regulationTitleStyling,
} from '@dmr.is/island-regulations/styling'
import { theme } from '@dmr.is/island-ui-theme'

import { globalStyle, GlobalStyleRule, style } from '@vanilla-extract/css'

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

export const bodyText = style({})
regulationContentStyling(bodyText)
regulationTitleStyling(bodyText)

// Diff marks, after @dmr.is/regulations-tools/diff.css but scoped to this
// modal. Not diffStyling: that colours every `ins` as added text, including
// `ins.mod` (formatting changed, text did not). Not diff.css itself either:
// it is a global stylesheet, and once loaded it would also restyle the getDiff
// marks in Breytingarsaga, which share these class names.
const diffMark = (selector: string, rule: GlobalStyleRule) =>
  globalStyle(`${bodyText} ${selector}`, rule)

diffMark(':is(ins, del):is(.diffins, .diffdel, .diffmod, .diffmove)', {
  padding: '0 0.125em',
})
// Added
diffMark(':is(ins.diffins, ins.diffmod)', {
  backgroundColor: '#c7efdb',
  textDecoration: 'underline solid',
  textUnderlineOffset: '0.15em',
})
// Removed
diffMark(':is(del.diffdel, del.diffmod)', {
  backgroundColor: '#f7cfcf',
  textDecoration: 'line-through',
  textDecorationColor: 'rgb(0 0 0 / 0.5)',
})
// Formatting changed, text did not — so not shown as added text.
diffMark('ins.mod', {
  backgroundColor: 'transparent',
  textDecoration: 'underline dotted 2px #d39200',
  textUnderlineOffset: '0.2em',
})
// Moved: highlighted where it arrived, struck through where it left.
diffMark('ins.diffmove', {
  backgroundColor: '#d6e2f7',
  textDecoration: 'underline double',
  textUnderlineOffset: '0.15em',
})
diffMark('del.diffmove', {
  backgroundColor: '#d6e2f7',
  textDecoration: 'line-through',
  textDecorationColor: 'rgb(0 0 0 / 0.5)',
  opacity: 0.7,
})

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
