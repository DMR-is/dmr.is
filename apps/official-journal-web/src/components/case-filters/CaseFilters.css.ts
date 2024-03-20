import { theme } from '@island.is/island-ui/theme'
import { recipe } from '@vanilla-extract/recipes'

export const caseFilters = recipe({
  base: {
    display: 'flex',
    gap: theme.grid.gutter.mobile,
    flexWrap: 'wrap',

    '@media': {
      [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
        gap: theme.grid.gutter.desktop,
      },
    },
  },
})
