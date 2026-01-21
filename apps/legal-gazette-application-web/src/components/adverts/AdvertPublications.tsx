'use client'

import { Fragment, useState } from 'react'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { ActionCard, Box, Stack, toast } from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { formatDate } from '@dmr.is/utils/client'

import {
  AdvertDto,
  AdvertPublicationDetailedDto,
  AdvertVersionEnum,
} from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import * as styles from './advert.css'

import { useMutation } from '@tanstack/react-query'

type Props = {
  advert: AdvertDto
  detailed?: boolean
}

export const AdvertPublications = ({ advert, detailed = false }: Props) => {
  const trpc = useTRPC()
  const [html, setHTML] = useState<string>('')
  const [openModal, setOpenModal] = useState<number | null>(null)

  const { mutate: getAdvertPublication } = useMutation(
    trpc.getAdvertPublication.mutationOptions(),
  )

  return (
    <Box padding={[2, 3, 4]} className={styles.advertPublication}>
      <Stack space={[2]}>
        {advert.publications.map((pub, i) => {
          const isPublished = !!pub.publishedAt
          const isRejected = advert.status.slug === 'hafnad'

          return (
            <Fragment key={i}>
              <ActionCard
                date={
                  pub.publishedAt
                    ? formatDate(pub.publishedAt)
                    : formatDate(pub.scheduledAt)
                }
                tag={{
                  label: isPublished
                    ? 'Útgefin'
                    : isRejected
                      ? 'Hafnað'
                      : 'Á áætlun',
                  variant: isPublished
                    ? 'mint'
                    : isRejected
                      ? 'red'
                      : 'blueberry',
                  outlined: false,
                }}
                headingVariant="h4"
                heading={detailed ? advert.title : `Birting ${pub.version}`}
                key={i}
                eyebrow={
                  detailed
                    ? `${advert.category.title} - ${advert.type.title} - Birting ${pub.version}`
                    : undefined
                }
                cta={{
                  label: 'Skoða auglýsingu',
                  icon: 'open',
                  iconType: 'outline',
                  buttonType: { variant: 'text' },

                  onClick: () => {
                    getAdvertPublication(
                      {
                        advertId: advert.id,
                        version: AdvertVersionEnum[pub.version],
                      },
                      {
                        onSuccess: (data: AdvertPublicationDetailedDto) => {
                          setHTML(data.html)
                          setOpenModal(i)
                        },
                        onError: () =>
                          toast.error('Ekki tókst að sækja birtingu'),
                      },
                    )
                  },
                }}
              />
              <Modal
                baseId={advert.id}
                isVisible={openModal === i}
                onVisibilityChange={(isVisible) => {
                  if (!isVisible) {
                    setOpenModal(null)
                  }
                }}
              >
                <AdvertDisplay withStyles html={html} />
              </Modal>
            </Fragment>
          )
        })}
      </Stack>
    </Box>
  )
}
