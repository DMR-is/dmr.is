import { style } from '@vanilla-extract/css'

export const modalBase = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100vh',
})

export const modalContent = style({
  backgroundColor: 'white',
  maxHeight: '80vh',
  overflowY: 'auto',
  padding: '24px',
  borderRadius: '16px',
})
