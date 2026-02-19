'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { formatDate } from '@dmr.is/utils/shared/format/date'

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
  let rejected = false

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

    if (adverts[0]?.status.slug === 'hafnad') {
      statusText = 'Hafnað'
      rejected = true
    }

    // count publications for dánarbúa and þrotabú adverts
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

      // if the Innköllun advert is rejected, mark application as rejected
      if (
        advert.type.slug.includes('Innkollun') &&
        advert.status.slug === 'hafnad'
      ) {
        statusText = 'Hafnað'
        rejected = true
      }
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

  const canBeRemoved = publications.length == 0 && !allPublished && !rejected

  const getStatusTagVariant = () => {
    if (rejected) return 'red'
    else if (allPublished) return 'mint'
    else if (application.status === ApplicationStatusEnum.DRAFT) return 'blue'
    else if (
      application.status === ApplicationStatusEnum.SUBMITTED ||
      statusText === 'Innsent'
    )
      return 'blueberry'
    return 'mint'
  }

  return (
    <Box borderRadius="large" border="standard" padding={3} background="white">
      <Stack space={[1, 0]}>
        <Inline justifyContent="spaceBetween" space={1}>
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
            <Tag variant={getStatusTagVariant()} disabled>
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
          <Inline
            justifyContent="spaceBetween"
            alignY="center"
            collapseBelow="sm"
            space={1}
          >
            {recallInProgress ? (
              <div className={cardExtraButtonStyle}>
                <AddAdvertsToApplicationMenu
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
