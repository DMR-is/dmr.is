import { theme } from '@island.is/island-ui/theme'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const dataTableHeadCellChevron = recipe({
  base: {
    transformOrigin: 'center',
    transform: 'rotate(-90deg)',
    transition: 'transform 0.2s',
  },
  variants: {
    order: {
      desc: {
        transform: 'rotate(0deg)',
      },
      asc: {
        transform: 'rotate(-180deg)',
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
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translate(-50%, -50%)',

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      background: theme.color.white,
    },
  },
})
export const linkTableCell = style({
  borderBottom: `1px solid ${theme.color.blue200}`,
  position: 'sticky',
  right: -1,
  top: 0,
})

export const linkTableHeaderCell = style({
  display: 'none',
  padding: 0,
})

export const seeMoreTableCellLink = recipe({
  base: {
    display: 'block',
    transition: 'opacity 0.15s',

    '@media': {
      [`screen and (max-width: ${theme.breakpoints.xl}px)`]: {
        background: theme.color.white,
      },
      [`screen and (min-width: ${theme.breakpoints.xl}px)`]: {
        opacity: 0,
      },
    },
  },
  variants: {
    opacity: {
      true: {
        '@media': {
          [`screen and (min-width: ${theme.breakpoints.xl}px)`]: {
            opacity: 1,
          },
        },
      },
    },
  },
})

export const seeMoreTableCellLinkText = style({
  width: 'max-content',
  background: theme.color.blue100,
  padding: '0.175rem 1rem 0.325rem',
})

export const seeMoreTableCellLinkIcon = style({
  paddingLeft: 4,
  height: 20,
  lineHeight: 18,
  verticalAlign: 'sub',
})

export const emptyRowMessage = style({
  fontStyle: 'italic',
  opacity: 0.5,
})

export const dataTableRow = recipe({
  base: {
    transition: 'background-color 0.15s',
    selectors: {
      '&:hover': {
        backgroundColor: theme.color.blue100,
      },
    },
  },

  variants: {
    expandable: {
      true: {
        cursor: 'pointer',
      },
      false: {
        cursor: 'default',
      },
    },
  },
})
