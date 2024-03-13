import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'
import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from '../../lib/constants'

export const header = style({
  blockSize: HEADER_HEIGHT,
  backgroundColor: theme.color.blue100,

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      blockSize: MOBILE_HEADER_HEIGHT,
    },
  },
})
