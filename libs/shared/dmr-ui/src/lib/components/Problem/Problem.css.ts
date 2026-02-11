import { theme } from '../../island-is/theme'

import { recipe } from '@vanilla-extract/recipes'

export const problemBase = recipe({
  base: {
    padding: theme.spacing[2],
  },
  variants: {
    variant: {
      alert: {},
      bordered: {
        borderStyle: theme.border.style.solid,
        borderWidth: theme.border.width.standard,
        borderRadius: theme.border.radius.lg,
      },
    },
    type: {
      'no-data': {},
      'bad-request': {},
      'server-error': {},
      'not-found': {},
    },
  },
  compoundVariants: [
    {
      variants: {
        variant: 'bordered',
        type: 'not-found',
      },
      style: {
        borderColor: theme.color.blue200,
      },
    },
    {
      variants: {
        variant: 'bordered',
        type: 'no-data',
      },
      style: {
        borderColor: theme.color.blue200,
      },
    },
    {
      variants: {
        variant: 'bordered',
        type: 'bad-request',
      },
      style: {
        borderColor: theme.color.yellow400,
      },
    },
    {
      variants: {
        variant: 'bordered',
        type: 'server-error',
      },
      style: {
        borderColor: theme.color.red200,
      },
    },
  ],
})
