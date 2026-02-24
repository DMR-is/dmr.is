import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'

export const accordionItemContainer = style({
  selectors: {
    '&:empty': {
      display: 'none',
    },

    '&:not(:empty)': {
      paddingBlock: theme.spacing[3],
    },

    '&:not(:empty):not(:last-child)': {
      borderBottom: `1px solid ${theme.color.blue200}`,
    },
  },
})
