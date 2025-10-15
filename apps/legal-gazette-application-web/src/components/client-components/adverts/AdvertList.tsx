'use client'

import { useToggle } from 'react-use'

import { Box, Stack } from '@island.is/island-ui/core'

import { AdvertDto } from '../../../gen/fetch'
import { AdvertModal } from '../advert-modal/AdvertModal'
import { AdvertPublications } from './AdvertPublications'

type Props = {
  adverts: AdvertDto[]
}

export const AdvertList = ({ adverts }: Props) => {
  const toggles = adverts.map(() => useToggle(false))

  return (
    <Box borderTopWidth="standard" borderColor="standard">
      <Stack space={[2, 3, 4]}>
        {adverts.map((advert) => (
          <AdvertPublications detailed advert={advert} />
        ))}
      </Stack>
      {adverts.map((advert, index) => {
        const [toggle, setToggle] = toggles[index]
        return (
          <AdvertModal
            id={advert.id}
            html=""
            isVisible={toggle}
            onVisiblityChange={setToggle}
          />
        )
      })}
    </Box>
  )
}
