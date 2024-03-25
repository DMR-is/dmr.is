import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'

const spacing = theme.spacing[1] / 2

export const tooltipStyle = style({
  borderRadius: theme.border.radius.xl,
  background: theme.color.dark400,
  paddingInline: spacing * 2,
  paddingBlock: spacing,
})

export const caseLabelTooltipIcon = style({
  inlineSize: 24,
  blockSize: 24,
})
