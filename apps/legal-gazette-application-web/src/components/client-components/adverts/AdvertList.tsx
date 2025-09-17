'use client'

import { useState } from 'react'

import { Box, Stack } from '@island.is/island-ui/core'

import { AdvertDto } from '../../../gen/fetch'
import { AdvertModal } from '../advert-modal/AdvertModal'
import { AdvertPublications } from './AdvertPublications'

type Props = {
  adverts: AdvertDto[]
}

export const AdvertList = ({ adverts }: Props) => {
  const [modalState, setModalState] = useState(() =>
    adverts.reduce(
      (acc, advert) => {
        acc[advert.id] = false
        return acc
      },
      {} as Record<string, boolean>,
    ),
  )

  return (
    <Box borderTopWidth="standard" borderColor="standard">
      <Stack space={[2, 3, 4]}>
        {adverts.map((advert) => (
          <AdvertPublications detailed advert={advert} />
        ))}
      </Stack>
      {adverts.map((advert) => (
        <AdvertModal
          id={advert.id}
          html=""
          isVisible={modalState[advert.id]}
          onVisiblityChange={(vis) =>
            setModalState((prev) => ({
              ...prev,
              [advert.id]: vis,
            }))
          }
        />
      ))}
    </Box>
  )
}
