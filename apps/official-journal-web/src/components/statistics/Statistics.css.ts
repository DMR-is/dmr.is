import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

export const statisticsEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',

  borderRadius: theme.border.radius.lg,
  border: `1px solid ${theme.color.blue200}`,
  paddingBlock: theme.spacing[8],
  paddingInline: theme.spacing[3],
})

export const statisticsWrapper = style({
  display: 'flex',
  justifyContent: 'center',
})

export const statisticsIndicator = style({
  width: 12,
  height: 12,
  borderRadius: '50%',
})
