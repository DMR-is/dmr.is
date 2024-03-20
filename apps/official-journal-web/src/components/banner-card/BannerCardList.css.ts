import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'
import { BLEED_HEIGHT } from '../../lib/constants'

const spacing = theme.spacing[3]

export const bannerCardList = style({
  rowGap: spacing,
  transform: `translateY(${BLEED_HEIGHT}px)`,
  marginTop: `-${BLEED_HEIGHT}px`,
  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      rowGap: `calc(${spacing}px / 2)`,
    },
  },
})
