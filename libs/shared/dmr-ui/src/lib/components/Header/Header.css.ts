import { theme, themeUtils } from '@dmr.is/island-ui-theme'

import { DMR_HEADER_HEIGHT, DMR_HEADER_MOBILE_HEIGHT } from '../constants'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const infoContainer = style({
  ...themeUtils.responsiveStyle({
    md: {
      border: `1px solid ${theme.color.dark100}`,
    },
  }),
})

export const infoDescription = style({
  fontWeight: 300,
  lineHeight: 1.5,
  fontSize: 14,
  maxHeight: 40,
  position: 'relative',
  overflow: 'auto',

  ...themeUtils.responsiveStyle({
    md: {
      fontSize: 18,
      maxHeight: 66,
    },
  }),
})

export const header = recipe({
  base: {
    height: DMR_HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',

    position: 'relative',
    zIndex: 1,

    '@media': {
      [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
        height: DMR_HEADER_MOBILE_HEIGHT,
      },
    },
  },
  variants: {
    variant: {
      white: {
        background: theme.color.white,
      },
      blue: {
        background: theme.color.blue100,
      },
    },
  },
})
