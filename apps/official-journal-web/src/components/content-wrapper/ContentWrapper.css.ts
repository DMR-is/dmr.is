import { recipe } from '@vanilla-extract/recipes'

import { theme } from '@island.is/island-ui/theme'

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
