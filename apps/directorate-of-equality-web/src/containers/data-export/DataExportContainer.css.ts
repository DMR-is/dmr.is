import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

/**
 * "Sækja lista", pinned to the bottom of the viewport while the filter column
 * is on screen.
 *
 * With six accordion cards expanded the panel runs well past a laptop viewport,
 * and the one control that acts on all of it sat at the very bottom — so
 * choosing a filter near the top meant scrolling down to submit and back up to
 * adjust. Sticky keeps the two a single motion apart.
 *
 * ⚠️ The opaque background is load-bearing, not decoration. A sticky element is
 * still in flow, so without it the filter cards scroll visibly *through* the
 * button. It matches the page behind it (`background="blue100"` on the
 * protected page shell) rather than the white filter panel, because it overlaps
 * the gap below the panel as often as the panel itself.
 *
 * Sticky bottoms out naturally at the end of its containing block, so on a
 * narrow screen — where the filter column and the results stack instead of
 * sitting side by side — it releases as the column scrolls past rather than
 * hovering over the table.
 */
export const submitBar = style({
  position: 'sticky',
  bottom: 0,
  // Above the filter panel it overlaps, below the react-select menus (z-index
  // 20 in `islandSelectStyles`) so an open dropdown is never clipped by it.
  zIndex: 1,
  background: theme.color.blue100,
  paddingTop: theme.spacing[2],
  paddingBottom: theme.spacing[2],
})
