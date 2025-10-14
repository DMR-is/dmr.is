import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const formStyles = style({
  background: theme.color.white,
  padding: theme.spacing[6],
  borderRadius: theme.border.radius.large,
})

export const formTabStyle = style({
  paddingBlockEnd: theme.spacing[6],
})

export const advertSideBarStyle = style({
  '@media': {
    [`(min-width: ${theme.breakpoints.lg}px)`]: {
      position: 'sticky',
      top: theme.spacing[6],
    },
  },
  // selectors: {
  //   [`@media (min-width: ${theme.breakpoints.lg}px)`]: {
  //     position: 'sticky',
  //     top: theme.spacing[6],
  //   },
  // },
})
