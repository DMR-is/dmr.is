import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'
import {
  BANNER_LARGE_MAX_HEIGHT,
  BANNER_SMALL_MAX_HEIGHT,
} from '../../lib/constants'
import { recipe } from '@vanilla-extract/recipes'

const spacing = theme.spacing[3]

export const bannerSection = recipe({
  base: {
    color: theme.color.white,
    paddingBlock: '0px !important',

    '@media': {
      [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
        maxHeight: 'initial',
      },
    },
  },
  variants: {
    variant: {
      small: {
        maxHeight: `${BANNER_SMALL_MAX_HEIGHT}px`,
      },
      large: {
        maxHeight: `${BANNER_LARGE_MAX_HEIGHT}px`,
      },
    },
  },
})

export const bannerContentColumn = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      paddingBlockStart: spacing,
      marginBlockEnd: spacing,
    },
  },
})

export const bannerImageColumn = style({
  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      display: 'none',
    },
  },
})
