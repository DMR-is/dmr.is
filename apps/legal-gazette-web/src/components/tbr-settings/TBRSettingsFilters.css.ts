import { theme } from '@dmr.is/ui/island-is/theme'

import { style } from '@vanilla-extract/css'

export const tbrSettingsCheckboxStyles = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  border: `1px solid ${theme.color.blue200}`,
  borderRadius: theme.border.radius.large,
})
