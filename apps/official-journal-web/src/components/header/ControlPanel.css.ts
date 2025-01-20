import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { theme } from '@island.is/island-ui/theme'

import { HEADER_HEIGHT } from '../../lib/constants'

export const controlPanel = style({
  height: HEADER_HEIGHT,
  inlineSize: 300,

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  borderLeft: `1px solid ${theme.color.blue200}`,
  borderRight: `1px solid ${theme.color.blue200}`,

  paddingInline: theme.spacing[3],
  position: 'relative',
  zIndex: 1,
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
