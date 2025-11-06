import { theme } from '@dmr.is/ui/island-is/theme'

import { style } from '@vanilla-extract/css'

export const shellWrapper = style({
  minHeight: `calc(100vh - 112px)`,
})

export const shellContent = style({
  borderTopLeftRadius: theme.border.radius.large,
  borderTopRightRadius: theme.border.radius.large,
})
