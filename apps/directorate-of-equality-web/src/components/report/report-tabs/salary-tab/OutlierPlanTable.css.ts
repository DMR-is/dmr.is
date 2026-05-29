import { theme } from '@dmr.is/island-ui-theme'

import { globalStyle, style } from '@vanilla-extract/css'

export const expandedRowItem = style({
  flex: '0 0 calc(50% - 8px)',

  // Desktop: groups of 2 share a color (items 1+2 white, items 3+4 blue)
  selectors: {
    '&:nth-child(4n+1), &:nth-child(4n+2)': {
      background: theme.color.white,
    },
    '&:nth-child(4n+3), &:nth-child(4n+4)': {
      background: theme.color.blue100,
    },
  },

  '@media': {
    '(max-width: 1080px)': {
      flex: '0 0 100%',
    },
  },
})

// Mobile: every other alternates
globalStyle(`.${expandedRowItem}:nth-child(odd)`, {
  '@media': {
    '(max-width: 1080px)': {
      background: theme.color.white,
    },
  },
})

globalStyle(`.${expandedRowItem}:nth-child(even)`, {
  '@media': {
    '(max-width: 1080px)': {
      background: theme.color.blue100,
    },
  },
})
