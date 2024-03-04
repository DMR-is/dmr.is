import { style } from '@vanilla-extract/css'

const gridItem = style({
  placeContent: 'center start',
})

export const imageWrapper = style([
  gridItem,
  {
    gridColumn: '8 / 12',
  },
])

export const contentWrapper = style([
  gridItem,
  {
    gridColumn: '2 / 8',
    height: '445px',
  },
])
