import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const shellWrapper = style({
  minHeight: `calc(100vh - 112px)`,
})

export const shellContent = style({
  borderTopLeftRadius: theme.border.radius.large,
  borderTopRightRadius: theme.border.radius.large,
})

export const shellFooter = style({
  borderBottomLeftRadius: theme.border.radius.large,
  borderBottomRightRadius: theme.border.radius.large,
})
