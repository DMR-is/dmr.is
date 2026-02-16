import { theme } from '@island.is/island-ui/theme'

import { globalStyle,style, styleVariants } from '@vanilla-extract/css'

export const container = style({
  display: 'inline-block',
  position: 'relative',
  lineHeight: 1,
  backgroundColor: 'transparent',
  padding: 0,
  border: 0,
})

export const tooltipContent = style({
  display: 'none',
  position: 'absolute',
  backgroundColor: theme.color.blue100,
  borderRadius: theme.border.radius.large,
  padding: theme.spacing[2],
  maxWidth: 240,
  border: `1px solid ${theme.color.blue200}`,
  fontWeight: theme.typography.light,
  fontSize: 15,
  lineHeight: '20px',
  fontFamily: theme.typography.fontFamily,
  color: theme.color.dark400,
  zIndex: 10000,
  whiteSpace: 'normal',
  pointerEvents: 'none',
  selectors: {
    [`${container}:hover &, ${container}:focus-within &`]: {
      display: 'block',
    },
  },
})

export const placement = styleVariants({
  top: {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: 8,
  },
  bottom: {
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 8,
  },
  left: {
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginRight: 8,
  },
  right: {
    left: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginLeft: 8,
  },
})

export const fullWidth = style({
  maxWidth: '100%',
  whiteSpace: 'pre-line',
})

globalStyle(`${container}:hover path`, {
  fill: theme.color.blue400,
})
