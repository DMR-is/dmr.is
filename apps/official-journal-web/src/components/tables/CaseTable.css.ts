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

export const tableHeadCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing[1],
})

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
    [`${tableRow}:hover &`]: {
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

export const advertModal = style({
  position: 'relative',
  maxWidth: 800,
  margin: '0 auto',
  background: '#fff',
  marginTop: '10vh',
})
export const advertModalHeader = style({
  position: 'absolute',
  top: 0,
  right: 15,
  left: 0,
  background: '#fff',
  height: 46,
  zIndex: 10,
})

export const advertModalClose = style({
  position: 'absolute',
  top: 0,
  right: 15,
  padding: 10,
  background: '#fff',
})
