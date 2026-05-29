import { style } from '@vanilla-extract/css'

export const expandedRowGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: 16,
})

export const expandedRowItem = style({
  flex: '0 0 calc(50% - 8px)',

  '@media': {
    '(max-width: 768px)': {
      flex: '0 0 100%',
    },
  },
})

export const expandedRowLabel = style({
  minWidth: 220,
})
