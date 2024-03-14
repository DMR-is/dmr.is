import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'
import { BANNER_MAX_HEIGHT, BLEED_HEIGHT } from '../../lib/constants'

const spacing = theme.spacing[3]

export const bannerSection = style({
  color: theme.color.white,
  paddingBlock: '0px !important',
  maxHeight: `${BANNER_MAX_HEIGHT}px`,

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.lg}px)`]: {
      maxHeight: 'initial',
    },
  },
})

export const footerWrapper = style({
  rowGap: spacing,
  transform: `translateY(${BLEED_HEIGHT}px)`,
  marginTop: `-${BLEED_HEIGHT}px`,
  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      rowGap: `calc(${spacing}px / 2)`,
    },
  },
})

export const bannerContentColumn = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',

  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      paddingBlockStart: spacing,
    },
  },
})

export const bannerImageColumn = style({
  '@media': {
    [`screen and (max-width: ${theme.breakpoints.md}px)`]: {
      marginTop: spacing,
    },
  },
})
