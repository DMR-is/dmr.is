import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const tabsTablist = style({
  position: 'relative',
  display: 'flex',
  overflowX: 'auto',
})

export const tabsTabPanel = style({
  paddingBlockStart: theme.spacing[5],
  paddingBlockEnd: theme.spacing[3],
})

export const tabsTab = recipe({
  base: {
    flex: 1,
    paddingBlock: theme.spacing[1],
    paddingInline: theme.spacing[5],
    textWrap: 'nowrap',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
