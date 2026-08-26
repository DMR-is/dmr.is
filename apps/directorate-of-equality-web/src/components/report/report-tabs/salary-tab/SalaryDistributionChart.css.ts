import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

/**
 * Kills the focus ring a plain mouse click draws around the whole plot.
 *
 * Recharts 3 turns its accessibility layer on by default, and `RootSurface`
 * puts `tabIndex={0}` and `role="application"` on the chart's `<svg>` (
 * `.recharts-surface`) so the data points can be walked with the arrow keys.
 * That makes the svg focusable, so clicking anywhere in the chart focuses it
 * and the browser outlines it — a border around the chart that reads as a
 * rendering bug.
 *
 * This lives in CSS because the `style` prop cannot reach that element:
 * `RootSurface` spreads the chart's attributes onto `<Surface>` and *then*
 * overrides `style` with its own full-width-and-height object, so a
 * `style={{ outline: 'none' }}` on `<ScatterChart>` is silently discarded. One
 * was there before this and never had any effect.
 *
 * The ring is suppressed unconditionally and then restored for `:focus-visible`
 * rather than left to `:focus:not(:focus-visible)` alone, because whether a
 * click matches `:focus-visible` on a `role="application"` svg is a browser
 * heuristic and differs between them. Stating both halves means the pointer
 * case is quiet everywhere and keyboard focus stays visible everywhere.
 */
export const chartFocus = style({
  selectors: {
    '& .recharts-surface:focus': {
      outline: 'none',
    },
    '& .recharts-surface:focus-visible': {
      outline: `3px solid ${theme.color.blue400}`,
      outlineOffset: 2,
    },
  },
})
