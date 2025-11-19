import { recipe } from '@vanilla-extract/recipes'

export const dataTablePagination = recipe({
  base: {
    display: 'grid',
    gridTemplateColumns: '9fr 2fr',
    gap: '16px',
    alignItems: 'baseline',
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
      fluid: {
        gridTemplateColumns: '1fr',
      },
    },
  },
})
