import { theme } from '@island.is/island-ui/theme'

import { globalStyle, style } from '@vanilla-extract/css'

/**
 * Marker class on the chart's `ResponsiveContainer`, so the rules below can
 * reach the svg recharts renders inside it without leaking to every chart in
 * the app.
 */
export const chartFocus = style({})

/**
 * Kills the focus ring a click draws inside the plot.
 *
 * Recharts 3 turns its accessibility layer on by default and scatters
 * focusable elements through the chart: `RootSurface` puts `tabIndex={0}` and
 * `role="application"` on the `<svg>` so the points can be walked with the
 * arrow keys, and `ZIndexSvgPortal` puts `tabIndex={-1}` on the `<g>` wrappers
 * it portals layers into. Chrome focuses either on a plain click and outlines
 * it — the svg gives a border around the whole chart, a portal `<g>` gives one
 * around the bounding box of the points. Both read as a rendering bug.
 *
 * So the reset is aimed at every focused descendant rather than at one element:
 * chasing them individually just moves the border somewhere else, as it did
 * once already.
 *
 * This has to be CSS at all because the `style` prop cannot reach the svg:
 * `RootSurface` spreads the chart's attributes onto `<Surface>` and *then*
 * overrides `style` with its own full-width-and-height object, so a
 * `style={{ outline: 'none' }}` on `<ScatterChart>` is silently discarded. One
 * was there before this and never had any effect.
 *
 * `globalStyle` rather than a `selectors` block on `chartFocus`: the targets
 * are descendants recharts owns, and vanilla-extract only allows `selectors`
 * whose subject is `&` itself.
 */
globalStyle(`${chartFocus} :focus`, {
  outline: 'none',
})

/**
 * Keyboard focus stays visible, on the one element that is a real tab stop.
 *
 * The `<svg>` is the only descendant recharts gives `tabIndex={0}`, and
 * arrow-key navigation of the data points is exactly what it is for, so those
 * users still need to see where they are. Everything else is `tabIndex={-1}` —
 * reachable by script or click but never by Tab — so it is owed no indicator.
 *
 * Higher specificity than the reset above, so it wins regardless of order.
 * Stated as its own rule rather than narrowing the reset to
 * `:focus:not(:focus-visible)`, because whether a click matches
 * `:focus-visible` on a `role="application"` svg is a browser heuristic and
 * differs between them.
 */
globalStyle(`${chartFocus} .recharts-surface:focus-visible`, {
  outline: `3px solid ${theme.color.blue400}`,
  outlineOffset: 2,
})
