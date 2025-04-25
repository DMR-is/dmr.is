import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

const spacing = theme.spacing[1] / 2

export const tooltipStyle = style({
  borderRadius: theme.border.radius.lg,
  background: theme.color.dark400,
  paddingInline: spacing * 2,
  paddingBlock: spacing,
})

export const caseLabelTooltipIcon = style({
  inlineSize: 24,
  blockSize: 24,
})
