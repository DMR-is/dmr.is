import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'

const spacing = theme.spacing[3]

export const bannerCardList = style({
  marginBlockStart: spacing,
  rowGap: spacing,
  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      rowGap: `calc(${spacing}px / 2)`,
    },
  },
})
