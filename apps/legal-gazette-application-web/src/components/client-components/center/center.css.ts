import { recipe } from '@vanilla-extract/recipes'

export const centerStyles = recipe({
  base: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  variants: {
    fullHeight: {
      true: {
        height: '100vh',
      },
      false: {
        height: 'auto',
      },
    },
  },
})
