import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const commentWrapper = style({
  borderBottom: `${theme.border.width.standard}px solid ${theme.color.blue200}`,
  padding: theme.spacing[2],

  display: 'grid',

  gridTemplateAreas: `
    'icon content date'
    'actions actions actions'
  `,

  gridTemplateColumns: '32px 1fr auto',
  gridTemplateRows: 'auto auto',

  gridColumnGap: theme.spacing[2],

  '@media': {
    [`screen and (min-width: ${theme.breakpoints.md}px)`]: {
      padding: theme.spacing[2],
    },
    [`screen and (min-width: ${theme.breakpoints.lg}px)`]: {
      padding: theme.spacing[3],
    },
  },
})

export const iconWrapper = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',

  width: theme.spacing[4],
  height: theme.spacing[4],
  borderRadius: '50%',
  border: `${theme.border.width.standard}px solid ${theme.color.blue200}`,

  gridArea: 'icon',
  placeSelf: 'center',
})

export const content = style({
  gridArea: 'content',
  alignContent: 'center',
})

export const date = style({
  gridArea: 'date',
  alignContent: 'center',
})
export const actions = style({
  marginTop: theme.spacing[2],
  gridArea: 'actions',
})
