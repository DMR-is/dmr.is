import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

export const list = style({
  /*
   * Two to three companies across at the modal's width, one on a narrow screen.
   * `auto-fill` with a minimum rather than a fixed column count — the same list
   * renders in a modal that is 8/12 of the grid on a large screen and full width
   * on a small one.
   */
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  columnGap: theme.spacing[3],
  rowGap: theme.spacing[1],

  // Capped rather than unbounded: a filter can match the whole register, and an
  // uncapped list would push the send button off the modal.
  maxHeight: 240,
  overflowY: 'auto',

  // The list's own chrome. The top margin and padding come from the `Box` props,
  // so overriding `margin` wholesale would fight the `marginTop` it applies.
  marginBottom: 0,
  listStyle: 'none',
})

export const item = style({
  /*
   * A company name is one long token often enough — "Verkfræðistofan
   * Eyrarbakki-Stokkseyri hf." — and in a 220px track an unbreakable one would
   * push a scrollbar across the whole list.
   */
  overflowWrap: 'anywhere',
})
