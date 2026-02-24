import { theme } from '@dmr.is/island-ui-theme'

import { keyframes, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const active = keyframes({
  '0%': {
    rotate: '0deg',
  },
  '100%': {
    rotate: '180deg',
  },
})

export const icon = style({
  display: 'flex',
  alignItems: 'center',
  width: '32px',
  height: '32px',
  padding: '5px',
  border: '1px solid ' + theme.color.purple200,
  borderRadius: '50%',
})

export const text = style({
  flexGrow: 1,
  padding: '0 32px 0 16px',
})

export const orderButton = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '50%',
    border: '1px solid ' + theme.color.purple200,
    rotate: '360deg',
    transition: 'rotate 0.3s',
  },
  variants: {
    order: {
      asc: {
        animation: `${active} 0.3s`,
        rotate: '180deg',
      },
      desc: {},
    },
  },
})
