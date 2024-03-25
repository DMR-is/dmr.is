import { theme } from '@island.is/island-ui/theme'
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
    bleed: {
      true: {
        paddingBlock: sectionSpacing + BLEED_HEIGHT,
        marginTop: -BLEED_HEIGHT,
      },
      false: {},
    },
    paddingTop: {
      default: {},
      off: { paddingBlockStart: 0 },
    },
  },
})
