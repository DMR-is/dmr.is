import { theme } from '@dmr.is/island-ui-theme'

import { globalStyle, style } from '@vanilla-extract/css'

export const reportCard = style({
  border: '1px solid transparent',
  transition: 'border-color 300ms ease-in-out',
  selectors: {
    'a:hover &': {
      borderColor: theme.color.blue400,
    },
    'a:focus-visible &': {
      borderColor: theme.color.blue400,
    },
  },
})

/**
 * ⚠️ `minmax(0, 1fr)`, not a bare `1fr`. `1fr` is `minmax(auto, 1fr)`, so a
 * track refuses to shrink below its content's min-content width — and the
 * widest value here is the ÍSAT description, which runs to 106 characters. A
 * bare `1fr` lets a long one push the grid wider than the expanded row and
 * scroll the table sideways instead of wrapping. `minmax(0, …)` makes the
 * tracks yield, so the value wraps to as many lines as it needs.
 */
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: theme.spacing[1],

  '@media': {
    '(max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
})

export const item = style({
  background: theme.color.white,
})

// Desktop (2 columns): items 3–4, 7–8, 11–12… → blue
globalStyle(
  `${grid} ${item}:nth-child(4n+3), ${grid} ${item}:nth-child(4n+4)`,
  { background: theme.color.blue100 },
)

// Mobile (1 column): override — even items blue, odd items white
globalStyle(`${grid} ${item}:nth-child(odd)`, {
  '@media': { '(max-width: 768px)': { background: theme.color.white } },
})

globalStyle(`${grid} ${item}:nth-child(even)`, {
  '@media': { '(max-width: 768px)': { background: theme.color.blue100 } },
})

/**
 * The label side of each label/value pair.
 *
 * ⚠️ `minWidth` alone is not enough, and was the bug: "Næsti skiladagur
 * jafnréttisáætlunar" is wider than 220px, so the label grew past its track and
 * its value started in the very next pixel — the date read as part of the
 * label. The gutter has to survive the label outgrowing the minimum, so it is
 * padding on the label rather than spacing between the two.
 *
 * `flexShrink: 0` keeps the label from being compressed instead, which would
 * wrap it to two lines and make the rows uneven.
 */
export const label = style({
  minWidth: 220,
  flexShrink: 0,
  paddingRight: theme.spacing[2],
})

/**
 * The value side of each label/value pair.
 *
 * `minWidth: 0` for the same reason the grid uses `minmax(0, 1fr)`: a flex
 * item's default `min-width: auto` refuses to shrink below its longest word, and
 * the ÍSAT descriptions carry 22-character compounds
 * ("köfnunarefnissamböndum"). `overflowWrap` is the last resort for a token with
 * no break opportunity at all, so nothing can spill out of the cell.
 */
export const value = style({
  minWidth: 0,
  overflowWrap: 'break-word',
})
