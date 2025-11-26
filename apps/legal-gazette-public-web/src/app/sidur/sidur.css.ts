import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const contentContainer = style({
  minHeight: 'calc(100vh - 25rem)',
  padding: '3rem 0 4rem',

  '@media': {
    [`(max-width: ${theme.breakpoints.md}px)`]: {
      padding: '2rem 0 3rem',
    },
  },
})
