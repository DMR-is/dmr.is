'use client'

import { Box, Footer as IslandIsFooter } from '@dmr.is/ui/components/island-is'

type Props = React.ComponentProps<typeof IslandIsFooter>
export const Footer = (props: Props) => {
  return (
    <Box paddingTop={6}>
      <IslandIsFooter {...props} />
    </Box>
  )
}
