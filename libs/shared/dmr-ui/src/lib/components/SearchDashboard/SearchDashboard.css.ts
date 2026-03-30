import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

export const root = style({
  display: 'grid',
  gap: theme.spacing[4],
})

export const section = style({
  background: theme.color.white,
  border: `1px solid ${theme.color.blue200}`,
  borderRadius: theme.border.radius.large,
  padding: theme.spacing[3],
})

export const filtersLayout = style({
  display: 'grid',
  gap: theme.spacing[3],
  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)',
      alignItems: 'end',
    },
  },
})

export const filterInputs = style({
  display: 'grid',
  gap: theme.spacing[3],
  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))',
    },
  },
})

export const presetField = style({
  minWidth: 220,
})

export const kpiGrid = style({
  display: 'grid',
  gap: theme.spacing[2],
  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
  },
})

export const trendGrid = style({
  display: 'grid',
  gap: theme.spacing[2],
  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
})

export const breakdownGrid = style({
  display: 'grid',
  gap: theme.spacing[2],
  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
})

export const tableGrid = style({
  display: 'grid',
  gap: theme.spacing[2],
})

export const card = style({
  background: theme.color.blue100,
  borderRadius: theme.border.radius.large,
  padding: theme.spacing[3],
})

export const cardHeader = style({
  marginBottom: theme.spacing[2],
})

export const labelWithTooltip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing[1],
  minWidth: 0,
})

export const kpiValue = style({
  color: theme.color.blue400,
  fontSize: 32,
  fontWeight: theme.typography.semiBold,
  lineHeight: 1,
})

export const trendSvg = style({
  width: '100%',
  height: 220,
  overflow: 'visible',
})

export const trendMeta = style({
  display: 'flex',
  justifyContent: 'spaceBetween',
  alignItems: 'center',
  marginTop: theme.spacing[2],
  color: theme.color.dark300,
  fontSize: 14,
})

export const trendSummary = style({
  display: 'flex',
  justifyContent: 'spaceBetween',
  alignItems: 'center',
  gap: theme.spacing[2],
})

export const trendChartWrap = style({
  overflowX: 'auto',
})

export const trendAxisLine = style({
  stroke: theme.color.blue200,
  strokeWidth: 1.5,
})

export const trendAxisTick = style({
  stroke: theme.color.blue300,
  strokeWidth: 1,
})

export const trendGridLine = style({
  stroke: theme.color.blue100,
  strokeDasharray: '4 6',
  strokeWidth: 1,
})

export const trendAxisLabel = style({
  fill: theme.color.dark300,
  fontFamily: theme.typography.fontFamily,
  fontSize: 12,
})

export const trendCrosshair = style({
  stroke: theme.color.blue200,
  strokeDasharray: '3 4',
  strokeWidth: 1,
})

export const trendPointHit = style({
  fill: 'transparent',
  cursor: 'pointer',
  selectors: {
    '&:focus': {
      outline: 'none',
    },
  },
})

export const trendColumnHit = style({
  fill: 'transparent',
  cursor: 'pointer',
  selectors: {
    '&:focus': {
      outline: 'none',
    },
  },
})

export const trendPoint = style({
  fill: theme.color.white,
  stroke: theme.color.blue400,
  strokeWidth: 2,
})

export const trendPointActive = style({
  fill: 'transparent',
  stroke: theme.color.mint600,
  strokeWidth: 2,
})

export const trendEmpty = style({
  border: `1px dashed ${theme.color.blue200}`,
  borderRadius: theme.border.radius.large,
  minHeight: 180,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const breakdownList = style({
  display: 'grid',
  gap: theme.spacing[2],
})

export const breakdownTrack = style({
  height: 8,
  background: theme.color.blue200,
  borderRadius: theme.border.radius.full,
  overflow: 'hidden',
})

export const breakdownFill = style({
  height: '100%',
  background: `linear-gradient(90deg, ${theme.color.blue400} 0%, ${theme.color.mint600} 100%)`,
  borderRadius: theme.border.radius.full,
})

export const queryCell = style({
  maxWidth: 280,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const tableHeadContent = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: theme.spacing[1],
})
