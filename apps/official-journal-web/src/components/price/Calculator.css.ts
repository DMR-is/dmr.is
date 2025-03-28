import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

export const percentage = style({
  position: 'absolute',
  zIndex: 1,
  right: 0,
  top: '40%',
  transform: 'translateY(-40%)',
  paddingRight: 24,
  color: theme.color.blue400,
  fontSize: 16,
})
