import { styleVariants } from '@vanilla-extract/css'

export const infoItemsGrid = styleVariants({
  2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  3: { display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16 },
  4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
})
