import { theme } from '@dmr.is/island-ui-theme'

import { recipe } from '@vanilla-extract/recipes'

export const contentWrapper = recipe({
  base: {
    padding: theme.spacing[3],
    borderRadius: theme.border.radius.large,
    border: `1px solid ${theme.color.blue200}`,
  },
  variants: {
    background: {
      white: { backgroundColor: theme.color.white },
      blue: { backgroundColor: theme.color.blue100 },
    },
  },
})
