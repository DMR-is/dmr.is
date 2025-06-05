import { DMR_HEADER_HEIGHT } from '@dmr.is/ui/components/constants'

import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const formShellStyles = style({
  background: theme.color.purple100,
  padding: theme.spacing[6],
  minHeight: `calc(100vh - ${DMR_HEADER_HEIGHT}px)`,
})

export const formStyles = style({
  background: theme.color.white,
  padding: theme.spacing[6],
  borderRadius: theme.border.radius.large,
})

export const formTabStyle = style({
  paddingBlockEnd: theme.spacing[6],
})
