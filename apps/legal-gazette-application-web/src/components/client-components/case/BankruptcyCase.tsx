'use client'

import { useState } from 'react'

import {
  ActionCard,
  Button,
  DropdownMenu,
  GridColumn,
  GridRow,
  Inline,
  LinkV2,
  Stack,
  TagVariant,
  Text,
} from '@island.is/island-ui/core'

import { AdvertDto, StatusEnum } from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'
import { formatDate } from '../../../lib/utils'
import { AdvertModal } from '../advert-modal/AdvertModal'

type Props = {
  adverts: AdvertDto[]
}

export const BankruptcyCase = ({ adverts }: Props) => {
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
      <Stack space={[4, 5, 6]}>
        <Stack space={[2, 3, 4]}>
          <Inline justifyContent="spaceBetween" alignY="center">
            <Text variant="h2">Auglýsingar tegndar umsókninni</Text>
            <LinkV2 href={PageRoutes.APPLICATIONS}>
              <Button preTextIcon="arrowBack" variant="text" size="small">
                Tilbaka í yfirlit
              </Button>
            </LinkV2>
          </Inline>
          <GridRow>
            <GridColumn span={['12/12', '9/12']}>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text>
            </GridColumn>
            <GridColumn span={['12/12', '3/12']}>
              <Inline align="right">
                <DropdownMenu
                  title="Valmynd"
                  openOnHover
                  icon="hammer"
                  iconType="outline"
                  items={[
                    {
                      title: 'Bæta við skiptafundi',
                    },
                    {
                      title: 'Bæta við skiptalokum',
                    },
                  ]}
                />
              </Inline>
            </GridColumn>
          </GridRow>
        </Stack>

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
