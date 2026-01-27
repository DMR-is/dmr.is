import { globalStyle, style } from '@vanilla-extract/css'

export const modalBase = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100vh',

  '@media': {
    print: {
      width: '100%',
      justifyContent: 'flex-start',

      height: 'auto',
    },
  },
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
})
