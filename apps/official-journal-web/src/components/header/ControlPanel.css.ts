import { theme } from '@island.is/island-ui/theme'

import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from '../../lib/constants'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const controlPanel = style({
  height: MOBILE_HEADER_HEIGHT,
  inlineSize: 160,

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  borderLeft: `1px solid ${theme.color.blue200}`,
  borderRight: `1px solid ${theme.color.blue200}`,
  paddingInline: theme.spacing[1],

  position: 'relative',
  zIndex: 1,

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
  top: '100%',
  left: 0,
  overflow: 'hidden',
  width: 300,
  borderBottomLeftRadius: theme.border.radius.large,
  borderBottomRightRadius: theme.border.radius.large,
  zIndex: 1,
})
