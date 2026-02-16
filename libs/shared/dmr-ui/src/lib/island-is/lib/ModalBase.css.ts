import { theme } from '@island.is/island-ui/theme'

import { globalStyle, style, styleVariants } from '@vanilla-extract/css'

export const dialog = style({
  border: 'none',
  padding: 0,
  backgroundColor: 'transparent',
  width: '100%',
  maxWidth: '100%',
  maxHeight: '100%',
  height: '100%',
  overflow: 'auto',
  outline: 'none',
})

export const backdropColor = styleVariants({
  default: {},
  white: {},
})

globalStyle(`${backdropColor.default}::backdrop`, {
  backgroundColor: `rgba(242, 247, 255, 0.7)`,
})

globalStyle(`${backdropColor.white}::backdrop`, {
  backgroundColor: theme.color.white,
})
