import { style } from '@vanilla-extract/css'

import { theme } from '@island.is/island-ui/theme'

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
