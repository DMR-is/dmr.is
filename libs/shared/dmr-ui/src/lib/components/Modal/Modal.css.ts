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
  padding: '24px',
  borderRadius: '8px',
  filter: 'drop-shadow(0 4px 70px rgba(0, 97, 255, .1))',
})
