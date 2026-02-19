import { theme } from '@dmr.is/ui/island-is/theme'

import { style } from '@vanilla-extract/css'

export const titleStyles = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap-reverse',
  gap: theme.spacing[2],
})
