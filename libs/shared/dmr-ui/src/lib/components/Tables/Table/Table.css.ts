import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const headerButton = style({
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  textAlign: 'left',
  width: '100%',
  cursor: 'pointer',
})

export const sortIcon = recipe({
  base: {
    transformOrigin: 'center',
    transform: 'rotate(-90deg)',
    transition: 'transform 0.2s',
  },
  variants: {
    order: {
      desc: { transform: 'rotate(0deg)' },
      asc: { transform: 'rotate(-180deg)' },
    },
  },
})

export const tableRow = recipe({
  base: {
    transition: 'background-color 0.15s',
  },
  variants: {
    expandable: {
      true: { cursor: 'pointer' },
      false: { cursor: 'default' },
    },
    expanded: {
      true: {},
      false: {},
    },
  },
})

export const line = style({
  position: 'absolute',
  left: 0,
  top: -1,
  bottom: 0,
  width: 2,
  zIndex: 1,
  height: 'calc(100% + 2px)',
  backgroundColor: theme.color.blue400,
})

export const expandButton = style({
  background: theme.color.blue100,
  border: 'none',
  padding: 0,
  margin: 0,
  marginLeft: theme.spacing[2],
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
})

export const emptyCell = style({
  padding: `${theme.spacing[5]} ${theme.spacing[3]}`,
  textAlign: 'center',
  borderBottom: `1px solid ${theme.color.blue200}`,
})
