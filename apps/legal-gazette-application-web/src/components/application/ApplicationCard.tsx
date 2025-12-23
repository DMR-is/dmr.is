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
  const publications =
    application.type === ApplicationTypeEnum.COMMON
      ? application.publications || []
      : []

  // check if all publications are published
  const allPublished =
    publications.length > 0
      ? publications.every((pub) => pub.publishedAt != null)
      : false

  if (allPublished) {
    statusText = 'Lokið'
  }

  return (
    <Box borderRadius="large" border="standard" padding={3} background="white">
      <Stack space={2}>
        <Inline justifyContent="spaceBetween">
          <Text color="purple400" variant="eyebrow" title="Uppfært">
            {`${formatDate(application.updatedAt, "dd. MMMM yyyy 'kl.' HH:mm")}`}
          </Text>
          <Inline space={1}>
            {publications.map(
              (pub, i) =>
                !!pub.publishedAt && (
                  <Tag key={i} variant={'mint'}>
                    Birting {pub.version} {'útgefin'}
                  </Tag>
                ),
            )}

            <Tag
              variant={
                application.status === ApplicationStatusEnum.DRAFT
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
