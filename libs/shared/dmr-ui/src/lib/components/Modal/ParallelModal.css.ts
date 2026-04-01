import { theme } from '@dmr.is/island-ui-theme'
import { hexToRgba } from '@dmr.is/island-ui-theme/utils'

import * as modalStyles from './Modal.css'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const parallelModalDialog = style([
  modalStyles.modalBaseBackdrop,
  {
    all: 'unset',
    width: '100%',
    outline: 0,
    transition: 'opacity 250ms ease-in-out',
    selectors: {
      '&[data-enter]': {
        opacity: 1,
      },
    },
  },
])

export const backdrop = recipe({
  base: {
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
  },
  variants: {
    color: {
      default: {
        backgroundColor: hexToRgba(theme.color.blue100, 0.7),
      },
      white: {
        backgroundColor: theme.color.white,
      },
    },
  },
  defaultVariants: {
    color: 'default',
  },
})
