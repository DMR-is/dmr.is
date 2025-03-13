import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { theme } from '@island.is/island-ui/theme'

import {
  CONTROL_PANEL_MOBILE_WIDTH,
  CONTROL_PANEL_WIDTH,
  DMR_HEADER_HEIGHT,
  DMR_HEADER_MOBILE_HEIGHT,
} from '../../contants'

export const controlPanel = style({
  position: 'relative',
  zIndex: 1,

  height: DMR_HEADER_HEIGHT,
  width: CONTROL_PANEL_WIDTH,

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  borderLeft: '1px solid',
  borderRight: '1px solid',
  borderColor: theme.color.blue200,

  paddingInline: theme.spacing[4],

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      height: DMR_HEADER_MOBILE_HEIGHT,
      width: CONTROL_PANEL_MOBILE_WIDTH,

      paddingInline: theme.spacing[2],
    },
  },
})

export const controlPanelChevron = recipe({
  base: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: '50%',
    padding: 4,
  },
  variants: {
    color: {
      blue: {
        background: theme.color.blue100,
      },
      white: {
        background: theme.color.white,
      },
    },
  },
})

export const dropdownMenu = style({
  position: 'relative',
  overflow: 'hidden',
  width: 300,
  borderBottomLeftRadius: theme.border.radius.large,
  borderBottomRightRadius: theme.border.radius.large,
})
