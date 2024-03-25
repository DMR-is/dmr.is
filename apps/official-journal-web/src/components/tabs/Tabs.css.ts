import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const tabsTablist = style({
  position: 'relative',
  display: 'flex',
  overflowX: 'auto',
})

export const tabsTabPanel = style({
  paddingBlock: theme.spacing[5],
})

export const tabsTab = recipe({
  base: {
    paddingBlock: theme.spacing[1],
    paddingInline: theme.spacing[5],
  },
  variants: {
    active: {
      true: {
        borderBottom: `1px solid ${theme.color.blue400}`,
      },
      false: {
        borderBottom: `1px solid ${theme.color.blue200}`,
      },
    },
  },
})
