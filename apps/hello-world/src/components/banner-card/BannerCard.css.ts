import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'

const spacing = theme.spacing[3]

export const bannerCardWrapper = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  height: '100%',
  gap: spacing,
  backgroundColor: theme.color.white,
  borderRadius: theme.border.radius.large,
  border: `1px solid ${theme.color.blue200}`,
  padding: spacing,
})

export const bannerCardTextWrapper = style({
  flexShrink: 1,
})

export const bannerCardImageWrapper = style({
  flexShrink: 0,
})
