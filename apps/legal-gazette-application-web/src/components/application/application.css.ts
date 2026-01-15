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

export const cardTagButtonStyle = style({})
globalStyle(`${cardTagButtonStyle} button:hover svg path`, {
  stroke: 'white !important',
})
globalStyle(`${cardTagButtonStyle} button:focus svg path`, {
  stroke: 'black',
})
globalStyle(`${cardTagButtonStyle} svg`, {
  marginTop: '4px',
})

export const cardExtraButtonStyle = style({ marginTop: theme.spacing[1] })

globalStyle(`${cardExtraButtonStyle} button`, {
  fontSize: '14px',
  padding: '12px',
  minHeight: '40px',
  color: theme.color.blue400,
})
