import { theme } from '@dmr.is/island-ui-theme'

import { style, styleVariants } from '@vanilla-extract/css'

export const stepRow = style({
  display: 'flex',
  flexDirection: 'row',
})

export const indicatorColumn = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginRight: theme.spacing[2],
})

export const circle = style({
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.color.white,
  fontSize: 16,
  fontWeight: theme.typography.semiBold,
})

export const circleVariants = styleVariants({
  active: { backgroundColor: theme.color.purple400, cursor: 'default' },
  complete: { backgroundColor: theme.color.purple400, cursor: 'pointer' },
  next: { backgroundColor: theme.color.purple200, cursor: 'default' },
})

export const connectingLine = style({
  width: 2,
  flex: 1,
  minHeight: 16,
})

export const connectingLineVariants = styleVariants({
  complete: { backgroundColor: theme.color.purple400 },
  incomplete: { backgroundColor: theme.color.purple200 },
})

export const contentColumn = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
})

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
})

export const titleRowClickable = style({
  cursor: 'pointer',
})

export const collapseWrapper = style({
  display: 'grid',
  transition: 'grid-template-rows 300ms ease',
  overflow: 'hidden',
})

export const collapseWrapperVariants = styleVariants({
  open: { gridTemplateRows: '1fr' },
  closed: { gridTemplateRows: '0fr' },
})

export const collapseInner = style({
  overflow: 'hidden',
})
