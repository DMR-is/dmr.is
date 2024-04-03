import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

import { theme } from '@island.is/island-ui/theme'

export const fixedCellWrapper = style({
  position: 'absolute',
  left: 0,
  top: 0,
  blockSize: '100%',
  inlineSize: '100%',
  display: 'flex',
  alignItems: 'center',
  zIndex: 1,
  boxShadow: '4px 0px 4px 0px #0161FD1A',
})

export const tableHeadCell = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing[1],
}

export const iconWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})
export const nameTableCell = style({
  overflow: 'hidden',
  maxWidth: '66ch',

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      maxWidth: '50ch',
    },
  },
})

export const tableRow = style({
  position: 'relative',
  backgroundColor: theme.color.white,
  selectors: {
    '&:hover': {
      backgroundColor: theme.color.blue100,
    },
  },
})

export const linkTableCell = style({
  borderBottom: `1px solid ${theme.color.blue200}`,

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.xl}px)`]: {
      position: 'sticky',
      right: -1,
      top: 0,
    },
  },
})

export const seeMoreTableCellLink = recipe({
  base: {
    display: 'block',
    background: theme.color.white,

    selectors: {
      [`${tableRow}:hover &`]: {
        background: theme.color.blue100,
      },
    },

    '@media': {
      [`screen and (min-width: ${theme.breakpoints.xl}px)`]: {
        display: 'none',
        position: 'absolute',
        right: theme.spacing[2],
        transform: 'translateY(-50%)',
        paddingInline: theme.spacing[1],
      },
    },
  },
  variants: {
    visible: {
      true: {
        '@media': {
          [`screen and (min-width: ${theme.breakpoints.xl}px)`]: {
            display: 'block',
          },
        },
      },
    },
  },
})

export const emptyRow = style({
  position: 'relative',
  blockSize: 80,
  borderBottom: `1px solid ${theme.color.blue200}`,
})

export const emptyRowMessageWrapper = style({
  paddingInline: theme.spacing[5],
  background: theme.color.white,
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
})

export const emptyRowMessage = style({
  fontStyle: 'italic',
  opacity: 0.5,
})
