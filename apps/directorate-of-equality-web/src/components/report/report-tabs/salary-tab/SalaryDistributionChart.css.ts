import { theme } from '@island.is/island-ui/theme'

import { globalStyle, style } from '@vanilla-extract/css'

/**
 * Marker class on the chart's `ResponsiveContainer`, so the rules below can
 * reach the svg recharts renders inside it without leaking to every chart in
 * the app.
 */
export const chartFocus = style({})

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
 * `globalStyle` rather than a `selectors` block on `chartFocus`: the target is
 * a descendant recharts owns, and vanilla-extract only allows `selectors` whose
 * subject is `&` itself.
 *
 * This has to be CSS at all because the `style` prop cannot reach that element:
 * `RootSurface` spreads the chart's attributes onto `<Surface>` and *then*
 * overrides `style` with its own full-width-and-height object, so a
 * `style={{ outline: 'none' }}` on `<ScatterChart>` is silently discarded. One
 * was there before this and never had any effect.
 */
globalStyle(`${chartFocus} .recharts-surface:focus`, {
  outline: 'none',
})

/**
 * Keyboard focus stays visible. Arrow-key navigation of the data points is
 * exactly what the `tabIndex` above is for, so those users still need to see
 * where they are.
 *
 * Stated as its own rule rather than narrowing the reset to
 * `:focus:not(:focus-visible)`, because whether a click matches
 * `:focus-visible` on a `role="application"` svg is a browser heuristic and
 * differs between them. Spelling out both halves keeps the pointer case quiet
 * everywhere and the keyboard case visible everywhere.
 */
globalStyle(`${chartFocus} .recharts-surface:focus-visible`, {
  outline: `3px solid ${theme.color.blue400}`,
  outlineOffset: 2,
})
