import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const gridLayout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(auto, 310px) minmax(0, 1fr)',
  gridTemplateAreas: `"sidebar main"`,
  gap: theme.spacing[4],
})

export const sidebarStyle = style({
  top: '0px',
  position: 'sticky',
  alignSelf: 'start',
  maxWidth: '310px',
})

export const mainStyle = style({
  gridArea: 'main',
})
