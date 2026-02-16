import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const popover = style({
  position: 'absolute',
  top: '100%',
  right: 0,
  zIndex: theme.zIndex.modal,
  marginTop: 8,
})
