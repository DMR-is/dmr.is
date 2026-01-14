import { theme } from '@dmr.is/ui/island-is/theme'

import { globalStyle, style } from '@vanilla-extract/css'

export const applicationShellStyles = style({
  borderTopLeftRadius: theme.border.radius.large,
  borderTopRightRadius: theme.border.radius.large,
})

export const sidebarStyles = style({
  position: 'sticky',
  top: 0,

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      position: 'static',
      top: 0,
    },
  },
})

export const cardDropdownStyle = style({ marginTop: theme.spacing[1] })

globalStyle(`${cardDropdownStyle} button`, {
  fontSize: '14px',
  padding: '12px',
  minHeight: '32px',
  color: theme.color.blue400,
})
