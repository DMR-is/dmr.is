'use client'

import { Box, Footer as IslandIsFooter } from '@island.is/island-ui/core'

type Props = React.ComponentProps<typeof IslandIsFooter>
export const Footer = (props: Props) => {
  return (
    <Box paddingTop={6}>
      <IslandIsFooter {...props} />
    </Box>
  )
}
