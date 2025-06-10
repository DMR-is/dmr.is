import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const formStyles = style({
  background: theme.color.white,
  padding: theme.spacing[6],
  borderRadius: theme.border.radius.large,
})

export const formTabStyle = style({
  paddingBlockEnd: theme.spacing[6],
})
