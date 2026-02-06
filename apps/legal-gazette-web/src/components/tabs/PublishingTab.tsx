'use client'

import { Box, Stack } from '@dmr.is/ui/components/island-is'

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
