import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

import { DMR_HEADER_HEIGHT, DMR_HEADER_MOBILE_HEIGHT } from '../../contants'

export const header = style({
  background: theme.color.blue100,
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
})
