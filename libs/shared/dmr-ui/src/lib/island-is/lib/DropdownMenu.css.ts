import { theme, zIndex } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

export const menuContainer = style({
  position: 'relative',
  display: 'inline-block',
})

export const menu = style({
  position: 'absolute',
  top: '100%',
  right: 0,
  minWidth: 150,
  zIndex: zIndex.aboveModal,
  boxShadow: '0px 4px 30px rgba(0, 97, 255, 0.16)',
  background: theme.color.white,
  borderRadius: theme.border.radius.large,
  display: 'flex',
  flexDirection: 'column',
  outline: 'none',
  marginTop: 8,
})

export const menuItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${theme.spacing[2]}px ${theme.spacing[1]}px`,
  cursor: 'pointer',
  width: '100%',
  border: 'none',
  backgroundColor: 'transparent',
  textDecoration: 'none',
  transition: 'color .2s',
  fontFamily: theme.typography.fontFamily,
  fontSize: 12,
  fontWeight: theme.typography.semiBold,
  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      fontSize: 14,
    },
  },
  color: theme.color.dark400,
  selectors: {
    '&:not(:last-child)': {
      boxShadow: `0 1px 0 0 ${theme.color.blue100}`,
    },
    '&:hover, &:focus': {
      textDecoration: 'none',
      color: theme.color.blue400,
      outline: 'none',
    },
  },
})
