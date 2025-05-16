import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

const spacing = theme.spacing[3]

export const bannerSection = style({
  color: theme.color.white,
  paddingBlockStart: theme.spacing[7],
  paddingBlockEnd: 0,

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      maxHeight: 'initial',
      paddingBlockStart: spacing,
    },
  },
})

export const bannerContentColumn = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

export const bannerImageColumn = style({
  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      display: 'none',
    },
  },
})
