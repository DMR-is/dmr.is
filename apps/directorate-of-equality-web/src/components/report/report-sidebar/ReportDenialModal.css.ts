import { spacing, theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

// Full-screen layover modal
export const layoverModal = style({
  overflow: 'hidden',
  backgroundColor: 'white',
  width: 650,
  height: 'fit-content',
  overflowY: 'auto',
  margin: 'auto',
  padding: theme.spacing[4],
  borderRadius: theme.border.radius.large,
})

// Modal content area
export const modalContent = style({
  margin: '0 auto',
  padding: `${spacing[3]}px ${spacing[4]}px`,
  paddingTop: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
  rowGap: spacing[3],
})

// Modal header
export const modalHeader = style({
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
})
