'use client'

import { useState } from 'react'

import { ActionCard, Stack, TagVariant } from '@island.is/island-ui/core'

import { AdvertDto, StatusEnum } from '../../../gen/fetch'
import { formatDate } from '../../../lib/utils'
import { AdvertModal } from '../advert-modal/AdvertModal'

type Props = {
  adverts: AdvertDto[]
}

export const AdvertList = ({ adverts }: Props) => {
  const tagVariant = (status: string): TagVariant => {
    switch (status) {
      case StatusEnum.Innsent:
        return 'blue'
      case StatusEnum.TilbúiðTilÚtgáfu:
        return 'blueberry'
      case StatusEnum.Hafnað:
        return 'rose'
      case StatusEnum.ÚTgefið:
        return 'mint'
      default:
        return 'yellow'
    }
  }

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
    <>
      <Stack space={[2, 3, 4]}>
        {adverts.map((advert) => (
          <ActionCard
            key={advert.id}
            date={formatDate(advert.scheduledAt)}
            heading={advert.title}
            eyebrow={advert.type.title}
            tag={{
              label: advert.status.title,
              variant: tagVariant(advert.status.title),
              outlined: false,
            }}
            cta={{
              label: 'Skoða auglýsingu',
              size: 'small',
              icon: 'open',
              iconType: 'outline',
              buttonType: {
                variant: 'text',
              },
              onClick: () =>
                setModalState((prev) => ({
                  ...prev,
                  [advert.id]: true,
                })),
            }}
          />
        ))}
      </Stack>
      {adverts.map((advert) => (
        <AdvertModal
          advert={advert}
          isVisible={modalState[advert.id]}
          onVisiblityChange={(vis) =>
            setModalState((prev) => ({
              ...prev,
              [advert.id]: vis,
            }))
          }
        />
      ))}
    </>
  )
}
