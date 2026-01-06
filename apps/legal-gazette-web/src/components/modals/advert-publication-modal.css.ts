import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const advertModalWrapperStyle = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
})

export const advertModalStyle = style({
  backgroundColor: theme.color.white,
  borderRadius: theme.border.radius.large,
  maxHeight: '80vh',
  overflowY: 'auto',
  width: '100%',
})
