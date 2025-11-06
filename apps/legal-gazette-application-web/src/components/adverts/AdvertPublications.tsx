'use client'

import { Fragment, useState } from 'react'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { formatDate } from '@dmr.is/utils/client'

import { ActionCard, Box, Stack, toast } from '@island.is/island-ui/core'

import {
  AdvertDto,
  AdvertPublicationDetailedDto,
  GetAdvertPublicationVersionEnum,
} from '../../gen/fetch'
import { trpc } from '../../lib/trpc/client'
import * as styles from './advert.css'

type Props = {
  advert: AdvertDto
  detailed?: boolean
}

export const AdvertPublications = ({ advert, detailed = false }: Props) => {
  const [html, setHTML] = useState<string>('')
  const [openModal, setOpenModal] = useState<number | null>(null)

  const { mutate: getAdvertPublication } =
    trpc.publicationApi.getAdvertPublication.useMutation()

  return (
    <Box padding={[2, 3, 4]} className={styles.advertPublication}>
      <Stack space={[2]}>
        {advert.publications.map((pub, i) => {
          const isPublished = pub.publishedAt !== null

          return (
            <Fragment key={i}>
              <ActionCard
                date={
                  pub.publishedAt
                    ? formatDate(pub.publishedAt)
                    : formatDate(pub.scheduledAt)
                }
                tag={{
                  label: isPublished ? 'Útgefin' : 'Á áætlun',
                  variant: isPublished ? 'mint' : 'blueberry',
                  outlined: false,
                }}
                headingVariant="h4"
                heading={detailed ? advert.title : `Birting ${pub.version}`}
                key={i}
                eyebrow={
                  detailed
                    ? `${advert.type.title} - ${advert.category.title} - Birting ${pub.version}`
                    : undefined
                }
                cta={{
                  label: 'Opna auglýsingu',
                  icon: 'open',
                  iconType: 'outline',
                  buttonType: { variant: 'text' },

                  onClick: () => {
                    getAdvertPublication(
                      {
                        advertId: advert.id,
                        version: GetAdvertPublicationVersionEnum[pub.version],
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
