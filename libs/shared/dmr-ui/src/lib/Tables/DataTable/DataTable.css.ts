import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { theme } from '@island.is/island-ui/theme'

export const dataTableHeadCellChevron = recipe({
  base: {
    transformOrigin: 'center',
    transform: 'rotate(-90deg)',
    transition: 'transform 0.2s',
  },
  variants: {
    order: {
      asc: {
        transform: 'rotate(0deg)',
      },
      desc: {
        transform: 'rotate(-180deg)',
      },
    },
  },
})

export const emptyRow = style({
  position: 'relative',
  blockSize: 80,
  borderBottom: `1px solid ${theme.color.blue200}`,
})

export const emptyRowMessageWrapper = style({
  paddingInline: theme.spacing[5],
  background: theme.color.white,
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
})

export const emptyRowMessage = style({
  fontStyle: 'italic',
  opacity: 0.5,
})

export const dataTableRow = recipe({
  base: {},
  variants: {
    expandable: {
      true: {
        cursor: 'pointer',

        selectors: {
          '&:hover': {
            backgroundColor: theme.color.blue100,
          },
        },
      },
      false: {
        cursor: 'default',
      },
    },
  },
})
