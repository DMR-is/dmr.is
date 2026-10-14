import { globalStyle, GlobalStyleRule } from '@vanilla-extract/css'

/**
 * Styles regulation diff marks inside `wrapper` — `getStructuredDiff`'s, and
 * `getDiff`'s, which use the same classes. Call it from a `.css.ts` file.
 *
 * After @dmr.is/regulations-tools/diff.css, but scoped. Not `diffStyling`:
 * that colours every `ins` as added text, including `ins.mod` (formatting
 * changed, text did not). Not diff.css itself either: it is a global
 * stylesheet, and would restyle every diff on the page once loaded.
 */
export const diffMarkStyling = (wrapper: string) => {
  const diffMark = (selector: string, rule: GlobalStyleRule) =>
    globalStyle(`${wrapper} ${selector}`, rule)

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
  // A rule has no text to wrap in ins/del; the differ marks the element itself.
  diffMark('hr[data-diff="insert"]', {
    borderColor: '#2e9e6a',
    borderTopWidth: 3,
  })
  diffMark('hr[data-diff="delete"]', {
    borderColor: '#d64545',
    borderTopWidth: 3,
    borderTopStyle: 'dashed',
  })
}
