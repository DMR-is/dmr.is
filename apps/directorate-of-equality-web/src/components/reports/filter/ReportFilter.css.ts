import { style } from '@vanilla-extract/css'

// Pulls the date section up to overlap the Filter component's bottom border
export const dateSection = style({
  marginTop: '-32px',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
})
