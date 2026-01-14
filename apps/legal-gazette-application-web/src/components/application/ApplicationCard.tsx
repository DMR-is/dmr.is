'use client'

import { useState } from 'react'

import {
  Box,
  Button,
  Inline,
  LinkV2,
  Stack,
  Tag,
  Text,
} from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { Icon } from '@island.is/island-ui/core'

import {
  ApplicationDto,
  ApplicationStatusEnum,
  ApplicationTypeEnum,
} from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'
import { AddAdvertsToApplicationMenu } from '../adverts/AddAdvertsToApplicationMenu'
import { cardExtraButtonStyle, cardTagButtonStyle } from './application.css'
import { RemoveApplicationAdvert } from './RemoveApplicationAdvert'

type Props = {
  application: ApplicationDto
}

export const ApplicationCard = ({ application }: Props) => {
  const [openModal, setOpenModal] = useState(false)

  const url =
    application.type === ApplicationTypeEnum.COMMON
      ? `${PageRoutes.APPLICATION_COMMON}/${application.id}`
      : application.type === ApplicationTypeEnum.RECALLBANKRUPTCY
        ? `${PageRoutes.APPLICATION_THROTABU}/${application.id}`
        : `${PageRoutes.APPLICATION_DANARBU}/${application.id}`

  let statusText =
    application.status === ApplicationStatusEnum.DRAFT
      ? 'Í vinnslu hjá notanda'
      : application.status === ApplicationStatusEnum.SUBMITTED
        ? 'Í vinnslu hjá ritstjórn'
        : 'Innsent'

  const adverts = application.adverts || []
  const publications: Array<{ title?: string; publishedAt?: string }> = []
  let allPublished = false

  // count publications for common adverts
  if (application.type === ApplicationTypeEnum.COMMON) {
    let pubCount = 0
    const advertPubs =
      adverts[0]?.publications.map((pub) => {
        if (pub.publishedAt) {
          pubCount++
        }
        return pub
      }) || []

    if (pubCount > 0) {
      publications.push({
        title: pubCount + '/' + advertPubs.length + ' birtingar útgefnar',
        publishedAt: new Date().toString(), // just to mark as published
      })

      // check if all publications are published
      allPublished = pubCount === advertPubs.length
    }

    if (allPublished) {
      statusText = 'Útgefin'
    }
    // count publications for da´narbúa and þrotabú adverts
  } else {
    let advertsCount = 0
    let pubCount = 0
    adverts.forEach((advert) => {
      advert.publications.forEach((pub) => {
        if (pub.publishedAt) {
          advertsCount++
        }
        // if Skiptalok is published, mark all as published
        if (advert.type.title == 'Skiptalok') {
          allPublished = true
        }
        pubCount++
      })
    })

    if (advertsCount > 0) {
      publications.push({
        title: advertsCount + '/' + pubCount + ' auglýsingar útgefnar',
        publishedAt: new Date().toString(), // just to mark as published
      })
    }

    if (allPublished) {
      statusText = 'Útgefið'
    }
  }

  const recallInProgress =
    application.type !== ApplicationTypeEnum.COMMON &&
    application.status === ApplicationStatusEnum.SUBMITTED &&
    !allPublished

  const canBeRemoved = publications.length == 0 && !allPublished

  return (
    <Box borderRadius="large" border="standard" padding={3} background="white">
      <Stack space={0}>
        <Inline justifyContent="spaceBetween">
          <Text color="purple400" variant="eyebrow" title="Uppfært">
            Uppfært:{' '}
            {`${formatDate(application.updatedAt, "dd. MMMM yyyy 'kl.' HH:mm")}`}
          </Text>
          <Inline space={1}>
            {!allPublished &&
              publications.map(
                (pub, i) =>
                  !!pub.publishedAt && (
                    <Tag key={i} variant={'mint'} disabled>
                      {pub.title}
                    </Tag>
                  ),
              )}
            <Tag
              variant={
                allPublished
                  ? 'mint'
                  : application.status === ApplicationStatusEnum.DRAFT
                    ? 'blue'
                    : ApplicationStatusEnum.SUBMITTED
                      ? 'blueberry'
                      : 'mint'
              }
              disabled
            >
              {statusText}
            </Tag>
            {canBeRemoved && (
              <div className={cardTagButtonStyle} title="Afturkalla">
                <Tag
                  variant="red"
                  onClick={() => {
                    setOpenModal(true)
                  }}
                >
                  <Icon
                    icon="trash"
                    type="outline"
                    size="small"
                    color="red600"
                  />
                </Tag>
              </div>
            )}
          </Inline>
        </Inline>

        <Stack space={1}>
          <Text variant="h3">{application.title}</Text>
          {recallInProgress && (
            <Text variant="medium">{application.subtitle}</Text>
          )}
          <Inline justifyContent="spaceBetween" alignY="center">
            {recallInProgress ? (
              <div className={cardExtraButtonStyle}>
                <AddAdvertsToApplicationMenu
                  asButtons
                  applicationId={application.id}
                  title={application.title + ' - ' + application.subtitle}
                />
              </div>
            ) : (
              <Text variant="medium">{application.subtitle}</Text>
            )}
            <LinkV2 href={url}>
              <Button
                variant="text"
                icon="arrowForward"
                iconType="outline"
                size="small"
              >
                {application.type === ApplicationTypeEnum.COMMON
                  ? 'Opna auglýsingu'
                  : 'Opna mál'}
              </Button>
            </LinkV2>
          </Inline>
        </Stack>
      </Stack>
      {openModal && (
        <RemoveApplicationAdvert
          applicationId={application.id}
          type={application.type}
          openModal={openModal}
          setOpenModal={setOpenModal}
        />
      )}
    </Box>
  )
}
