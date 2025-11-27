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

  const statusText =
    application.status === ApplicationStatusEnum.DRAFT
      ? 'Í vinnslu hjá notanda'
      : ApplicationStatusEnum.SUBMITTED
        ? 'Í vinnslu hjá ritstjórn'
        : 'Lokið'

  return (
    <Box borderRadius="large" border="standard" padding={3} background="white">
      <Stack space={2}>
        <Inline justifyContent="spaceBetween">
          <Text color="purple400" variant="eyebrow">
            {`Stofnuð: ${formatDate(application.createdAt)} | Uppfærð: ${formatDate(
              application.updatedAt,
            )}`}
          </Text>
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
