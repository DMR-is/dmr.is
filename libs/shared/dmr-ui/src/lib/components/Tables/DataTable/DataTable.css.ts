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
  background: theme.color.white,
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
})
export const linkTableCell = style({
  borderBottom: `1px solid ${theme.color.blue200}`,
  position: 'sticky',
  right: -1,
  top: 0,

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.xl - 1}px)`]: {
      background: 'inherit',
    },
  },
})

export const linkTableHeaderCell = style({
  display: 'none',
  padding: 0,
})

export const seeMoreTableCellLink = recipe({
  base: {
    display: 'block',
    background: 'inherit',
    padding: theme.spacing[2],

    '@media': {
      [`screen and (min-width: ${theme.breakpoints.xl}px)`]: {
        visibility: 'hidden',
      },
    },
  },
  variants: {
    visible: {
      true: {
        '@media': {
          [`screen and (min-width: ${theme.breakpoints.xl}px)`]: {
            visibility: 'visible',
            background: theme.color.blue100,
          },
        },
      },
    },
  },
})

export const seeMoreTableCellLinkText = style({
  position: 'relative',
  paddingBottom: 4,
  width: 'max-content',
  color: theme.color.blue400,

  selectors: {
    '&:hover': {
      background: theme.color.blue100,
    },
  },

  '@media': {
    [`screen and (min-width: ${theme.breakpoints.xl}px)`]: {
      // position: 'absolute',
      marginRight: theme.spacing[2],
      // transform: 'translateY(-50%)',
      paddingInline: theme.spacing[1],
      '::before': {
        content: "''",
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'currentColor',
        height: 2,
      },
    },
  },
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
  base: {},
  variants: {
    expandable: {
      true: {
        cursor: 'pointer',

        selectors: {
          '&:hover': {
            backgroundColor: theme.color.blue100,
          },
        },
      },
      false: {
        cursor: 'default',
      },
    },
  },
})
