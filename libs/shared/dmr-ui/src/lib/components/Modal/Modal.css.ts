import { theme } from '@dmr.is/island-ui-theme'

import { globalStyle, style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

/** The card's own padding, shared out to the sections in the pinned layout. */
const GUTTER = 24

export const modalBase = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100vh',

  '@media': {
    print: {
      position: 'static',
      top: 0,
      left: 0,
      width: '100%',
      justifyContent: 'flex-start',
      height: 'auto',
      background: 'white',
      zIndex: 9999,
    },
  },
})

export const modalContent = recipe({
  base: {
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
  },
  variants: {
    overflow: {
      scrollable: {
        overflowY: 'auto',
        '@media': {
          print: {
            overflowY: 'visible',
          },
        },
      },
      visible: {
        overflowY: 'visible',
      },
    },
    /**
     * Pins the title row and the footer and scrolls only what is between them.
     * Always paired with the `visible` overflow variant.
     *
     * No "off" member and no default, deliberately: an unset variant contributes
     * no class at all, so the 25 existing callers keep the exact class string
     * they had before this variant existed.
     *
     * The padding moves off this box and onto the three sections — left on the
     * card, the scrollbar would run the full height beside a title that never
     * moves, and content would scroll through the gutter rather than behind it.
     */
    scroll: {
      chrome: {
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        '@media': {
          print: {
            display: 'block',
            padding: GUTTER,
          },
        },
      },
    },
  },
  defaultVariants: {
    overflow: 'scrollable',
  },
})

/** The pinned title row. Sized by its content; never scrolls. */
export const pinnedHeader = style({
  flexShrink: 0,
  padding: `${GUTTER}px ${GUTTER}px 16px`,
  borderBottom: `1px solid ${theme.color.blue200}`,
})

/** The only part that scrolls. */
export const pinnedBody = style({
  flexGrow: 1,
  // A flex item's `min-height` is `auto`, which refuses to shrink below the
  // content's height — without this the box grows past the card's `max-height`
  // and the page scrolls instead of the body.
  minHeight: 0,
  overflowY: 'auto',
  padding: `${GUTTER}px`,
  '@media': {
    print: {
      overflowY: 'visible',
    },
  },
})

/** The pinned action row. */
export const pinnedFooter = style({
  flexShrink: 0,
  padding: `16px ${GUTTER}px ${GUTTER}px`,
  borderTop: `1px solid ${theme.color.blue200}`,
})

// Print styles to ensure modals are rendered correctly when printing
export const modalBaseBackdrop = style({
  '@media': {
    print: {
      position: 'static',
      width: '100%',
      height: 'auto',
      maxHeight: 'none',
      overflow: 'visible',
    },
  },
})

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

globalStyle(`body.modal-open`, {
  '@media': { print: { overflow: 'visible' } },
})

globalStyle(`body.modal-open .print-hidden, body.modal-open footer`, {
  '@media': { print: { display: 'none' } },
})
