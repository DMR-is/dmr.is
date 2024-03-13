import { theme } from '@island.is/island-ui/theme'
import { globalStyle } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { BLEED_HEIGHT } from '../../lib/constants'

const sectionSpacing = theme.spacing[9]

export const section = recipe({
  base: {
    paddingBlock: sectionSpacing,
  },
  variants: {
    variant: {
      default: {
        backgroundColor: theme.color.white,
      },
      blue: {
        backgroundColor: theme.color.blue100,
      },
    },
  },
})

globalStyle(`${section()}:first-of-type + section`, {
  paddingBlockStart: sectionSpacing + BLEED_HEIGHT,
})
