import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const tabsTablist = style({
  position: 'relative',
  display: 'flex',
  overflowX: 'auto',
  borderBottom: `2px solid ${theme.color.blue200}`,
  width: '100%',
})

export const tabsTabPanel = style({
  paddingBlockStart: theme.spacing[5],
  paddingBlockEnd: theme.spacing[3],
})

export const tabsTab = recipe({
  base: {
    paddingBlock: theme.spacing[2],
    paddingInline: theme.spacing[3],
    textWrap: 'nowrap',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
    cursor: 'pointer',
    textAlign: 'center',
    selectors: {
      '&:hover': {
        backgroundColor: theme.color.blue100,
      },
    },
  },
  variants: {
    active: {
      true: {
        borderBottomColor: theme.color.blue400,
      },
      false: {
        borderBottomColor: 'transparent',
      },
    },
  },
})

export const tabLink = style({
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  flex: 1,
})
