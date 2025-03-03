import { recipe } from '@vanilla-extract/recipes'
import { theme } from '@island.is/island-ui/theme'

const BLEED_HEIGHT = theme.spacing[6]

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
        paddingBlockStart: sectionSpacing + BLEED_HEIGHT,
        marginTop: -BLEED_HEIGHT,
      },
      false: {},
    },
    paddingTop: {
      default: {},
      content: {
        paddingBlockStart: theme.spacing[4],
      },
      off: { paddingBlockStart: 0 },
    },
  },
})
