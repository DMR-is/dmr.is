import { style } from '@vanilla-extract/css'

export const grid = style({
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: 16,
})

export const item = style({
  flex: '0 0 calc(50% - 8px)',

  '@media': {
    '(max-width: 768px)': {
      flex: '0 0 100%',
    },
  },
})

export const label = style({
  minWidth: 220,
})
