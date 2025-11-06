import { theme } from '@dmr.is/ui/components/island-is'

import { style } from '@vanilla-extract/css'

export const advertPublication = style({
  marginTop: '-1px',
  marginInline: '-1px',
  border: `${theme.border.width.standard}px ${theme.border.style.solid} ${theme.border.color.standard}`,
  borderRadius: theme.border.radius.large,
  borderTopLeftRadius: 'unset',
  borderTopRightRadius: 'unset',
  borderTop: '0',
})
