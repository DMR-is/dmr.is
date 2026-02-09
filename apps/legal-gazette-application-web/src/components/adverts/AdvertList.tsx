'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { AdvertDto } from '../../gen/fetch'
import { AdvertPublications } from './AdvertPublications'

type Props = {
  adverts: AdvertDto[]
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
