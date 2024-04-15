import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

export const caseFilters = style({
  display: 'flex',
  gap: theme.grid.gutter.mobile,
  flexWrap: 'wrap',

  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      gap: theme.grid.gutter.desktop,
    },
  },
})
