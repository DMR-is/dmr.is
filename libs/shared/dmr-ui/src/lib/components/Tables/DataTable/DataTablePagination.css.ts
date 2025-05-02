import { recipe } from '@vanilla-extract/recipes'

export const dataTablePagination = recipe({
  base: {
    display: 'grid',
    gridTemplateColumns: '9fr 2fr',
    gap: '0px',
    alignItems: 'center',
    padding: '0px 16px',
  },
  variants: {
    size: {
      small: {
        gridTemplateColumns: '9fr 2fr',
      },
      medium: {
        gridTemplateColumns: '9fr 2fr',
      },
      large: {
        gridTemplateColumns: '9fr 2fr',
      },
    },
  },
})
