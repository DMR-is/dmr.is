import { spacing } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

// Modal content area
export const modalContent = style({
  margin: '0 auto',
  padding: `${spacing[3]}px ${spacing[4]}px`,
  paddingTop: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
})
