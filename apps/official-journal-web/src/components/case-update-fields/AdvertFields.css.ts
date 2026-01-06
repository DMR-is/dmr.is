import { style } from '@vanilla-extract/css'

export const fieldBody = style({
  zIndex: 1,
  position: 'relative',
})

export const linkButton = style({
  ':hover': {
    textDecoration: 'none',
  },
})
