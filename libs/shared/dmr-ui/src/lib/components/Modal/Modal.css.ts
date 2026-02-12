import { globalStyle, style } from '@vanilla-extract/css'

export const modalBase = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100vh',

  '@media': {
    print: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      justifyContent: 'flex-start',
      height: '100%',
      background: 'white',
      zIndex: 9999,
    },
  },
})

export const modalContent = style({
  backgroundColor: 'white',
  maxHeight: '80vh',
  padding: '24px',
  borderRadius: '8px',
  pointerEvents: 'auto',
  filter: 'drop-shadow(0 4px 70px rgba(0, 97, 255, .1))',
  '@media': {
    print: {
      filter: 'none',
      maxHeight: 'none',
    },
  },
})

// Print styles to ensure modals are rendered correctly when printing
export const modalBaseBackdrop = style({})

globalStyle(`div:has(${modalBaseBackdrop})`, {
  '@media': {
    print: {
      position: 'static',
      overflow: 'visible',
    },
  },
})

globalStyle(`${modalBase} > div`, {
  '@media': { print: { padding: 0 } },
})

globalStyle(`${modalBase} button`, {
  '@media': { print: { display: 'none' } },
})

globalStyle(`body.modal-open .print-hidden, body.modal-open footer`, {
  '@media': { print: { display: 'none' } },
})
