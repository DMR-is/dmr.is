import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

const HEADER_HEIGHT = 112
const MOBILE_HEADER_HEIGHT = 104

export const controlPanel = style({
  height: MOBILE_HEADER_HEIGHT,
  inlineSize: 160,

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  paddingInline: theme.spacing[1],

  position: 'relative',
  zIndex: 1,

  '::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 20,
    width: 1,
    height: 72,
    backgroundColor: theme.color.blue200,
  },

  '@media': {
    [`screen and (min-width: ${theme.breakpoints.lg}px)`]: {
      height: HEADER_HEIGHT,
    },
    [`screen and (min-width: ${theme.breakpoints.sm}px)`]: {
      inlineSize: 300,
      paddingInline: theme.spacing[3],
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
  position: 'absolute',
  top: '82%', // 82% is used to position the dropdown menu right below the control panel button, taking into account the padding and the height of the button
  left: 0,
  overflow: 'hidden',
  width: 300,
  borderBottomLeftRadius: theme.border.radius.large,
  borderBottomRightRadius: theme.border.radius.large,
  zIndex: 1,
})
