import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

const spacing = theme.spacing[1] / 2

export const container = style({
  display: 'inline-block',
  position: 'relative',
  lineHeight: 1,
})

export const tooltipStyle = style({
  display: 'none',
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginBottom: 8,
  borderRadius: theme.border.radius.lg,
  background: theme.color.dark400,
  paddingInline: spacing * 2,
  paddingBlock: spacing,
  whiteSpace: 'nowrap',
  zIndex: 10000,
  pointerEvents: 'none',
  selectors: {
    [`${container}:hover &, ${container}:focus-within &`]: {
      display: 'block',
    },
  },
})

export const caseLabelTooltipIcon = style({
  inlineSize: 24,
  blockSize: 24,
})
