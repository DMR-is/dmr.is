import { theme } from '@island.is/island-ui/theme'
import { style } from '@vanilla-extract/css'

export const contentColumn = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

export const linkWrapper = style({
  position: 'relative',
  display: 'flex',
  alignSelf: 'flex-start',
  marginBlockStart: theme.spacing[2],
  paddingBottom: 4,
  selectors: {
    '&::before': {
      content: '',
      blockSize: 1,
      inlineSize: '100%',
      position: 'absolute',
      bottom: 0,
      left: 0,
      backgroundColor: theme.color.blue400,
    },
  },
})

export const linkIcon = style({
  position: 'relative',
  top: 5,
  marginInlineStart: 2,
})
