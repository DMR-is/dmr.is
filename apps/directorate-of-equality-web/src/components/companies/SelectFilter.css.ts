import { themeUtils } from '@dmr.is/island-ui-theme'

import { globalStyle, style } from '@vanilla-extract/css'

export const root = style({})

// Match MultiSelectFilter: 16px text inset and a 24px chevron. island-ui's sm
// Select grows both from md up (24px inset, 32px icon).
globalStyle(`${root} .island-select__control`, {
  ...themeUtils.responsiveStyle({ md: { paddingLeft: 0 } }),
})

globalStyle(`${root} .island-select__dropdown-indicator svg`, {
  width: 24,
  height: 24,
})
