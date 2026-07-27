import { theme } from '@dmr.is/ui/island-is/theme'

import { style, styleVariants } from '@vanilla-extract/css'

export const tree = style({
  border: `1px solid ${theme.color.blue200}`,
  borderRadius: theme.border.radius.large,
  overflow: 'hidden',
})

// Capped so the detail panel below it stays reachable without a long scroll.
export const scrollArea = style({
  maxHeight: 520,
  overflowY: 'auto',
})

export const row = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing[1],
  padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
  borderBottom: `1px solid ${theme.color.blue100}`,
  textAlign: 'left',
  ':hover': {
    background: theme.color.blue100,
  },
})

export const rowVariants = styleVariants({
  category: {},
  type: {
    paddingLeft: theme.spacing[6],
    background: theme.color.white,
  },
})

export const selected = style({
  background: theme.color.blue200,
  ':hover': {
    background: theme.color.blue200,
  },
})

export const inactive = style({
  opacity: 0.55,
})

export const chevron = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  flexShrink: 0,
  borderRadius: theme.border.radius.standard,
  ':hover': {
    background: theme.color.blue200,
  },
})

export const grow = style({
  flexGrow: 1,
  minWidth: 0,
})

export const meta = style({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing[2],
  flexShrink: 0,
})

export const groupHeader = style({
  padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
  background: theme.color.yellow200,
  borderBottom: `1px solid ${theme.color.blue100}`,
})

export const detail = style({
  border: `1px solid ${theme.color.blue200}`,
  borderRadius: theme.border.radius.large,
  padding: theme.spacing[3],
})

export const sidebar = style({
  background: theme.color.blue100,
  border: `1px solid ${theme.color.blue200}`,
  borderRadius: theme.border.radius.large,
  padding: theme.spacing[3],
})

// --- Change log expanded row ---

// Full-bleed inside the expanded row: an inset panel left odd white corners.
export const logDetail = style({
  background: theme.color.blue100,
  padding: theme.spacing[3],
})

export const logDetailGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: theme.spacing[2],
})

export const logDetailValue = style({
  background: theme.color.white,
  border: `1px solid ${theme.color.blue200}`,
  borderRadius: theme.border.radius.standard,
  padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
})

export const logDetailValueMuted = style({
  background: 'transparent',
  border: `1px dashed ${theme.color.blue200}`,
  borderRadius: theme.border.radius.standard,
  padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
})
