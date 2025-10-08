import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const accordionItemContainer = style({
  selectors: {
    '&:empty': {
      display: 'none',
    },

    '&:not(:empty):not(:last-child)': {
      borderBottom: `1px solid ${theme.color.blue200}`,
      paddingBlock: theme.spacing[3],
    },
  },
})
