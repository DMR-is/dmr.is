import { theme } from '@island.is/island-ui/theme'

import { DMR_HEADER_HEIGHT, DMR_HEADER_MOBILE_HEIGHT } from '../constants'

import { recipe } from '@vanilla-extract/recipes'

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
