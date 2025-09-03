'use client'

import { useState } from 'react'
import useSWR from 'swr'

import { ActionCard, Box, Stack, toast } from '@island.is/island-ui/core'

import {
  AdvertDto,
  AdvertPublicationDetailedDto,
  ApiErrorDto,
  GetAdvertPublicationRequest,
  GetAdvertPublicationVersionEnum,
} from '../../../gen/fetch'
import { getAdvertPublication } from '../../../lib/fetchers'
import { formatDate } from '../../../lib/utils'
import { AdvertModal } from '../advert-modal/AdvertModal'
import * as styles from './advert.css'

type Props = {
  advert: AdvertDto
}

export const AdvertPublications = ({ advert }: Props) => {
  const [html, setHTML] = useState<string>('')
  const [toggle, setToggle] = useState(false)

  const [publicationRequest, setPublicationRequest] =
    useState<GetAdvertPublicationRequest | null>(null)

  useSWR<AdvertPublicationDetailedDto, ApiErrorDto>(
    publicationRequest ? publicationRequest : null,
    getAdvertPublication,
    {
      onSuccess: (data) => {
        setHTML(data.html)
        setToggle(true)
      },
      onError: (_error) => {
        toast.error('Ekki tókst að sækja birtingu', {
          toastId: 'advert-publication-error',
        })
        setPublicationRequest(null)
      },
      dedupingInterval: 2000,
    },
  )

  return (
    <Box padding={[2, 3, 4]} className={styles.advertPublication}>
      <Stack space={[2]}>
        {advert.publications.map((pub, i) => {
          const isPublished = pub.publishedAt !== null
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
                heading={`Birting ${pub.version}`}
                key={i}
                cta={{
                  label: 'Opna auglýsingu',
                  icon: 'open',
                  iconType: 'outline',
                  buttonType: { variant: 'text' },

                  onClick: () => {
                    setToggle(true)
                    setPublicationRequest({
                      advertId: advert.id,
                      version: GetAdvertPublicationVersionEnum[pub.version],
                    })
                  },
                }}
              />
              <AdvertModal
                id={advert.id}
                html={html}
                onVisiblityChange={(vis) => setToggle(vis)}
                isVisible={
                  pub.version === publicationRequest?.version && toggle
                }
              />
            </>
          )
        })}
      </Stack>
    </Box>
  )
}
