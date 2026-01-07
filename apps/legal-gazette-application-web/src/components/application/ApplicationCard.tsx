'use client'

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

import {
  AdvertPublicationDto,
  ApplicationDto,
  ApplicationStatusEnum,
  ApplicationTypeEnum,
} from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'

type Props = {
  application: ApplicationDto
}

export const ApplicationCard = ({ application }: Props) => {
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

  // get publication only for common applications
  const adverts = application.adverts || []

  let publications: Array<{ title?: string; publishedAt?: string }> = []
  let allPublished = false

  if (application.type === ApplicationTypeEnum.COMMON) {
    publications =
      adverts[0]?.publications.map((pub) => ({
        title: pub.publishedAt ? `Birting ${pub.version} útgefin` : undefined,
        publishedAt: pub.publishedAt,
      })) || []

    // check if all publications are published
    allPublished =
      publications.length > 0
        ? publications.every((pub) => pub.publishedAt != null)
        : false
  } else {
    let skiptafundurCount = 0
    adverts.forEach((advert) => {
      advert.publications.forEach((pub) => {
        // if skiptafundur, just count how many were published
        if (advert.type.title == 'Skiptafundur' && pub.publishedAt) {
          skiptafundurCount++
          // if Skiptalok is published, mark all as published
        } else if (advert.type.title == 'Skiptalok' && pub.publishedAt) {
          allPublished = true
        } else {
          publications.push({
            title: pub.publishedAt
              ? `${advert.type.title} (${pub.version}) útgefin`
              : undefined,
            publishedAt: pub.publishedAt,
          })
        }
      })
    })
    // add skiptafundur publication if any were published
    if (skiptafundurCount > 0) {
      publications.push({
        title:
          skiptafundurCount +
          ` ${skiptafundurCount > 1 ? ' skiptafundir útgefnir' : 'skiptafundur útgefinn'}`,
        publishedAt: new Date().toString(), // just to mark as published
      })
    }
  }

  if (allPublished) {
    statusText = 'Útgefið'
  }

  return (
    <Box borderRadius="large" border="standard" padding={3} background="white">
      <Stack space={2}>
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
                    <Tag key={i} variant={'mint'}>
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
            >
              {statusText}
            </Tag>
          </Inline>
        </Inline>

        <Stack space={1}>
          <Text variant="h3">{application.title}</Text>
          <Inline justifyContent="spaceBetween" alignY="center">
            <Text variant="medium">{application.subtitle}</Text>
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
    </Box>
  )
}
