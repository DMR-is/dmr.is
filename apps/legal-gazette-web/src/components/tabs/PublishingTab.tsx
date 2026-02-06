'use client'


import { Box } from '@dmr.is/ui/components/island-is'

import { Stack } from '@island.is/island-ui/core'

import AdvertsToBePublished from '../Tables/AdvertsToBePublished'


export const PublishingTab = () => {

  return (
    <Box background="white" paddingTop={4}>
      <Stack space={[3, 4, 5]}>
        <AdvertsToBePublished />
      </Stack>
    </Box>
  )
}
export default PublishingTab
