'use client'

import { formatDate } from '@dmr.is/utils/client'

import {
  Box,
  Button,
  Inline,
  LinkV2,
  Stack,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import {
  ApplicationDto,
  ApplicationStatusEnum,
  ApplicationTypeEnum,
} from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'

type Props = {
  application: ApplicationDto
}

export const ApplicationCard = ({ application }: Props) => {
  const url =
    application.applicationType === ApplicationTypeEnum.COMMON
      ? `${PageRoutes.APPLICATION_COMMON}/${application.id}`
      : application.applicationType === ApplicationTypeEnum.RECALLBANKRUPTCY
        ? `${PageRoutes.APPLICATION_THROTABU}/${application.id}`
        : `${PageRoutes.APPLICATION_DANARBU}/${application.id}`

  const statusText =
    application.status === ApplicationStatusEnum.DRAFT ? 'Í vinnslu' : 'Innsend'

  return (
    <Box borderRadius="large" border="standard" padding={3} background="white">
      <Stack space={2}>
        <Inline justifyContent="spaceBetween">
          <Text color="purple400" variant="eyebrow">
            {`Stofnuð: ${formatDate(application.createdAt)} | Uppfærð: ${formatDate(
              application.updatedAt,
            )}`}
          </Text>
          <Tag variant="blue">{statusText}</Tag>
        </Inline>

        <Stack space={1}>
          <Text variant="h3">{application.title}</Text>
          <Inline align="right">
            <LinkV2 href={url}>
              <Button
                variant="text"
                icon="arrowForward"
                iconType="outline"
                size="small"
              >
                Opna umsókn
              </Button>
            </LinkV2>
          </Inline>
        </Stack>
      </Stack>
    </Box>
  )
}
