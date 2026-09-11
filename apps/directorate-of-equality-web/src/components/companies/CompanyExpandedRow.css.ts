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

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: theme.spacing[1],

  '@media': {
    '(max-width: 768px)': {
      gridTemplateColumns: '1fr',
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
