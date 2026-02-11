'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Footer as IslandIsFooter } from '@dmr.is/ui/components/island-is/Footer'

type Props = React.ComponentProps<typeof IslandIsFooter>
export const Footer = (props: Props) => {
  return (
    <Box paddingTop={6}>
      <IslandIsFooter {...props} />
    </Box>
  )
}
