import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

export const footerDivider = style({
  borderLeft: '1px solid ' + theme.color.blue200,
  height: '100%',
  position: 'absolute',
  top: '0',
  right: '20px',

  '@media': {
    [`(max-width: ${theme.breakpoints.md}px)`]: {
      display: 'none',
    },
  },
})
