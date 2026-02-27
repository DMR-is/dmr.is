'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { ApplicationAdvert } from '../../lib/trpc/types'
import { AdvertPublications } from './AdvertPublications'

type Props = {
  adverts: ApplicationAdvert[]
}

export const AdvertList = ({ adverts }: Props) => {
  return (
    <Box borderTopWidth="standard" borderColor="standard">
      <Stack space={[2, 3, 4]}>
        {adverts.map((advert) => (
          <AdvertPublications key={advert.id} detailed advert={advert} />
        ))}
      </Stack>
    </Box>
  )
}
