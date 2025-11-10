import { theme } from '@dmr.is/ui/island-is/theme'

import { style } from '@vanilla-extract/css'

export const applicationShellStyles = style({
  borderTopLeftRadius: theme.border.radius.large,
  borderTopRightRadius: theme.border.radius.large,
})

export const sidebarStyles = style({
  position: 'sticky',
  top: theme.spacing[5],
  paddingBlock: theme.spacing[4],
  paddingInline: theme.spacing[2],
  borderRadius: theme.border.radius.large,
  backgroundColor: theme.color.white,

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      position: 'static',
      top: 0,
    },
  },
})
