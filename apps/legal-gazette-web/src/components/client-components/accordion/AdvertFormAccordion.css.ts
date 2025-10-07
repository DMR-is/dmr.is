import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'

export const advertFormAccordion = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.color.blue200}`,
      paddingBottom: theme.spacing[3],
      marginBottom: theme.spacing[3],
    },
  },
})

export const accordionItemContainer = style({
  selectors: {
    '&:empty': {
      display: 'none',
    },

    '&:not(:empty):not(:last-child)': {
      borderBottom: `1px solid ${theme.color.blue200}`,
      paddingBottom: theme.spacing[3],
      marginBottom: theme.spacing[3],
    },
  },
})
