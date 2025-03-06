import { recipe } from '@vanilla-extract/recipes'

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
