'use client'

import { useState } from 'react'
import { useToggle } from 'react-use'

import { formatDate } from '@dmr.is/utils/client'

import { ActionCard, Box, Stack, toast } from '@island.is/island-ui/core'

import {
  AdvertDto,
  AdvertPublicationDetailedDto,
  GetAdvertPublicationVersionEnum,
} from '../../../gen/fetch'
import { trpc } from '../../../lib/trpc/client'
import { AdvertModal } from '../advert-modal/AdvertModal'
import * as styles from './advert.css'

type Props = {
  advert: AdvertDto
  detailed?: boolean
}

export const AdvertPublications = ({ advert, detailed = false }: Props) => {
  const [html, setHTML] = useState<string>('')

  const [toggles] = useState(advert.publications.map(() => useToggle(false)))

  const { mutate: getAdvertPublication } =
    trpc.publicationApi.getAdvertPublication.useMutation()

  return (
    <Box padding={[2, 3, 4]} className={styles.advertPublication}>
      <Stack space={[2]}>
        {advert.publications.map((pub, i) => {
          const isPublished = pub.publishedAt !== null

          const [toggle, setToggle] = toggles[i]

          return (
            <>
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
                    setToggle(true)
                    getAdvertPublication(
                      {
                        advertId: advert.id,
                        version: GetAdvertPublicationVersionEnum[pub.version],
                      },
                      {
                        onSuccess: (data: AdvertPublicationDetailedDto) => {
                          setHTML(data.html)
                        },
                        onError: () =>
                          toast.error('Ekki tókst að sækja birtingu'),
                      },
                    )
                  },
                }}
              />
              <AdvertModal
                id={advert.id}
                html={html}
                onVisiblityChange={(vis) => setToggle(vis)}
                isVisible={toggle}
              />
            </>
          )
        })}
      </Stack>
    </Box>
  )
}
