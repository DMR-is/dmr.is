import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

const FILTER_MENU_MAX_HEIGHT = 416
const FILTER_MENU_WIDTH = 432
export const filterMenu = style({
  position: 'relative',
  zIndex: 10,
})

export const filterMenuPopover = style({
  maxHeight: FILTER_MENU_MAX_HEIGHT,
  width: FILTER_MENU_WIDTH,
  overflowY: 'auto',
  borderTopRightRadius: theme.border.radius.large,
  borderTopLeftRadius: theme.border.radius.large,
  background: theme.color.white,
  boxShadow: '0px 11px 24px 0px #0000001A',
})

export const filterMenuClearButton = style({
  padding: theme.spacing[3],
  background: theme.color.blue100,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderBottomLeftRadius: theme.border.radius.large,
  borderBottomRightRadius: theme.border.radius.large,
  boxShadow: '0px 11px 24px 0px #0000001A',
})
