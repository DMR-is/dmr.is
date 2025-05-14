import { theme } from '@island.is/island-ui/theme'

import { createContainer, style } from '@vanilla-extract/css'

const cardContainer = createContainer()

export const bannerCardWrapper = style({
  height: '100%',

  backgroundColor: theme.color.white,
  borderRadius: theme.border.radius.large,
  border: `1px solid ${theme.color.blue200}`,
  padding: theme.spacing[3],

  containerName: cardContainer,
  containerType: 'inline-size',
  selectors: {},
})

export const bannerCard = style({
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column-reverse',
  alignItems: 'center',
  '@container': {
    [`${cardContainer} (min-width: 300px)`]: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  },
})

export const bannerCardTextWrapper = style({
  flexShrink: 1,
})

export const bannerCardImageWrapper = style({
  flexShrink: 0,
})
