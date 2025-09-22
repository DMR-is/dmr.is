import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const gridLayout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(auto, 310px) minmax(0, 1fr)',
  gridTemplateAreas: `"sidebar main"`,
  gap: theme.spacing[4],

  '@media': {
    [`(max-width: ${theme.breakpoints.md}px)`]: {
      gridTemplateColumns: '1fr',
      gridTemplateAreas: `"sidebar" "main"`,
    },
  },
})

export const sidebarStyle = style({
  top: '0px',
  position: 'sticky',
  alignSelf: 'start',
  maxWidth: '310px',

  '@media': {
    [`(max-width: ${theme.breakpoints.md}px)`]: {
      maxWidth: '100%',
      position: 'static',
    },
  },
})

export const mainStyle = style({
  gridArea: 'main',
})
