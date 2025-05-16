import { theme } from '@island.is/island-ui/theme'

import { keyframes } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'

export const spinner = recipe({
  base: {
    borderRadius: '50%',
    border: `3px solid ${theme.color.blue200}`,
    borderBottomColor: theme.color.blue400,
    animationName: keyframes({
      from: {
        transform: 'rotate(0deg)',
      },
      to: {
        transform: 'rotate(360deg)',
      },
    }),
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  variants: {
    size: {
      small: {
        width: 14,
        height: 14,
      },
      medium: {
        width: 18,
        height: 18,
      },
      large: {
        width: 24,
        height: 24,
      },
    },
  },
})
