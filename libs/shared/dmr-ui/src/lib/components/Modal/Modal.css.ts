import { theme } from '@island.is/island-ui/theme'
import { hexToRgba } from '@island.is/island-ui/utils'

import { globalStyle, style, styleVariants } from '@vanilla-extract/css'

export const backdrop = style({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflowX: 'hidden',
  overflowY: 'auto',
  transition: `opacity 250ms ease-in-out`,
  opacity: 0,
  zIndex: 10000,
  selectors: {
    '&[data-enter]': {
      opacity: 1,
    },
  },
})

export const backdropColor = styleVariants({
  default: {
    backgroundColor: hexToRgba(theme.color.blue100, 0.7),
  },
  white: {
    backgroundColor: theme.color.white,
  },
})

export const parallelModal = style({
  all: 'unset',
  width: '100%',
  outline: 0,
  transition: 'opacity 250ms ease-in-out',
  selectors: {
    '&[data-enter]': {
      opacity: 1,
    },
  },
})

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

globalStyle(`div:has(> ${modalBaseBackdrop})`, {
  '@media': {
    print: {
      position: 'static',
      overflow: 'visible',
    },
  },
})

globalStyle(`body *`, {
  '@media': { print: { display: 'none' } },
})

globalStyle(`body, div, ${modalBaseBackdrop} ,${modalBaseBackdrop} *`, {
  '@media': { print: { display: 'block' } },
})

globalStyle(`${modalBase} button`, {
  '@media': { print: { display: 'none' } },
})

globalStyle(`.print-hidden`, {
  '@media': { print: { display: 'none' } },
})

globalStyle(`${modalBase} > div`, {
  '@media': { print: { padding: 0 } },
})

globalStyle(`body`, {
  '@media': { print: { scrollbarWidth: 'none', msOverflowStyle: 'none' } },
})

globalStyle(`::-webkit-scrollbar`, {
  '@media': { print: { display: 'none' } },
})
