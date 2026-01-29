import { globalStyle, style } from '@vanilla-extract/css'

export const modalBase = style({
  position: 'absolute',
  margin: 'auto',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  height: 'fit-content',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  '@media': {
    print: {
      width: '100%',
      justifyContent: 'flex-start',

      height: 'auto',
    },
  },
  pointerEvents: 'none',
})

export const modalContent = style({
  backgroundColor: 'white',
  maxHeight: '80vh',
  padding: '24px',
  borderRadius: '8px',
  filter: 'drop-shadow(0 4px 70px rgba(0, 97, 255, .1))',
  '@media': {
    print: {
      borderRadius: 0,
      filter: 'none',
      padding: 0,
      maxHeight: '100%',
    },
  },
})

globalStyle(`${modalBase} button`, {
  '@media': { print: { display: 'none' } },
})
globalStyle(`${modalBase} div`, {
  '@media': { print: { border: 'none' } },
  pointerEvents: 'auto',
})
