import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from '../../lib/constants'

export const header = style({
  position: 'relative',
  zIndex: 1,
  blockSize: HEADER_HEIGHT,
  backgroundColor: theme.color.blue100,

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  selectors: {
    '&.white': {
      backgroundColor: '#fff',
    },
  },

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      blockSize: MOBILE_HEADER_HEIGHT,
    },
  },
})
