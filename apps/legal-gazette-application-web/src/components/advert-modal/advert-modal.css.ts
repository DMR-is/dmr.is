import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const advertModalWrapperStyle = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
})

export const advertModalStyle = style({
  backgroundColor: theme.color.white,
  borderRadius: theme.border.radius.large,
  minHeight: '80vh',
  width: '100%',
})
