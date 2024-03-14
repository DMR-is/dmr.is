import { style } from '@vanilla-extract/css'
import { HEADER_HEIGHT } from '../../lib/constants'
import { theme } from '@island.is/island-ui/theme'

export const controlPanel = style({
  inlineSize: 300,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'space-between',
  height: HEADER_HEIGHT,
  borderLeft: `1px solid ${theme.color.blue200}`,
  borderRight: `1px solid ${theme.color.blue200}`,
  paddingInline: theme.spacing[3],
})

export const controlPanelWrapper = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const controlPanelTitle = style({
  fontSize: 14,
  fontWeight: theme.typography.semiBold,
})

export const controlPanelButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: theme.color.white,
})
