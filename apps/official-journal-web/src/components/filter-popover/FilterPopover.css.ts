import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

const spacing = theme.spacing[3]

const MAX_POPOVER_HEIGHT = 432
const MAX_FILTER_GROUP_HEIGHT = 310

export const filterPopover = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: MAX_POPOVER_HEIGHT,
  overflowY: 'auto',
  boxShadow: theme.shadows.medium,
  backgroundColor: theme.color.white,
  inlineSize: '100vw',
  maxInlineSize: 430,
})

export const filterPopoverFilters = style({
  paddingInline: spacing,
})

export const filterExpandButtonWrapper = style({
  display: 'flex',
  flexDirection: 'column',

  borderBottom: `1px solid ${theme.color.blue200}`,
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
})

export const filterExpandButton = style({
  display: 'flex',
  justifyContent: 'space-between',
  paddingBlock: spacing,
})

export const filterExpandButtonIcon = style({
  backgroundColor: theme.color.blue100,
  borderRadius: '50%',
  inlineSize: 24,
  blockSize: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

export const filterGroup = recipe({
  base: {
    display: 'none',
    flexDirection: 'column',
    gap: 8,
    color: theme.color.dark400,
    height: '100%',
    maxHeight: MAX_FILTER_GROUP_HEIGHT,
    overflowY: 'auto',
  },

  variants: {
    expanded: {
      true: {
        display: 'flex',
        marginBlockEnd: spacing,
      },
    },
  },
})

export const resetAllButtonWrapper = style({
  display: 'flex',
  justifyContent: 'stretch',
})

export const resetAllButton = style({
  flex: 1,
  backgroundColor: theme.color.blue100,
  color: theme.color.blue400,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: spacing,
})

export const resetAllButtonContent = style({
  position: 'relative',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing[1],

  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      blockSize: 1,
      inlineSize: '100%',
      bottom: -4,
      left: 0,
      backgroundColor: theme.color.blue400,
    },
  },
})
