import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'

export const advertsOverviewListEmpty = style({
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  minInlineSize: 200,
  borderRadius: theme.border.radius.large,
  border: `1px solid ${theme.color.blue200}`,
  padding: theme.spacing[3],
  gap: theme.spacing[3],

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.sm}px)`]: {
      flexDirection: 'column',
    },
  },
})

export const advertsListOverview = style({
  backgroundColor: theme.color.white,
})

export const advertsOverviewListItem = style({
  padding: theme.spacing[1],
  borderBottom: `1px solid ${theme.color.blue200}`,
  fontWeight: theme.typography.light,
})
