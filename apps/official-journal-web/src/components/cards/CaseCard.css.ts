import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

export const wrapper = style({
  padding: theme.spacing[3],
  borderRadius: theme.border.radius.large,
  border: `1px solid ${theme.color.blue200}`,
  backgroundColor: theme.color.white,
})
