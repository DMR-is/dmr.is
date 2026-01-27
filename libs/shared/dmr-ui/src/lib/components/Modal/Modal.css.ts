import { style } from '@vanilla-extract/css'

export const modalBase = style({
  position: 'absolute',
  margin: 'auto',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  height: 'fit-content',
  display: 'flex',
  pointerEvents: 'none',
})

export const modalContent = style({
  backgroundColor: 'white',
  maxHeight: '80vh',
  padding: '24px',
  borderRadius: '8px',
  filter: 'drop-shadow(0 4px 70px rgba(0, 97, 255, .1))',
  pointerEvents: 'auto',
})
