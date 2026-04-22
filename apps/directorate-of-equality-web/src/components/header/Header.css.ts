import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

const HEADER_HEIGHT = 112
const MOBILE_HEADER_HEIGHT = 104

export const header = style({
  position: 'relative',
  zIndex: 1,
  blockSize: HEADER_HEIGHT,

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      blockSize: MOBILE_HEADER_HEIGHT,
    },
  },
})
