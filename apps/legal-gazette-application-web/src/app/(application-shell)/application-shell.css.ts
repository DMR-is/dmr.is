import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const shellWrapper = style({
  height: `calc(100vh - 112px)`,
  paddingBlock: theme.spacing[6],
})
