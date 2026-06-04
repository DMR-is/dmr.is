import { theme } from '@dmr.is/island-ui-theme'

import { style } from '@vanilla-extract/css'
export const reportCard = style({
  border: '1px solid transparent',
  transition: 'border-color 300ms ease-in-out',
  selectors: {
    'a:hover &': {
      borderColor: theme.color.blue400,
    },
    'a:focus-visible &': {
      borderColor: theme.color.blue400,
    },
  },
})

export const grid = style({
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: theme.spacing[2],
})

export const item = style({
  flex: `0 0 calc(50% - ${theme.spacing[1]})`,

  '@media': {
    '(max-width: 768px)': {
      flex: '0 0 100%',
    },
  },
})

export const label = style({
  minWidth: 220,
})
