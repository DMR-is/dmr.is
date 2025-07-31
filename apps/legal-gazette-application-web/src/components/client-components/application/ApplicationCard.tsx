'use client'

import { mutate } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  Box,
  Button,
  Icon,
  Inline,
  LinkV2,
  Stack,
  Tag,
  Text,
  toast,
} from '@island.is/island-ui/core'

import {
  ApplicationDto,
  ApplicationDtoStatusEnum,
  ApplicationDtoTypeEnum,
} from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'
import { deleteApplication } from '../../../lib/fetchers'

type Props = {
  application: ApplicationDto
}

export const ApplicationCard = ({ application }: Props) => {
  const { trigger: deleteApplicationTrigger } = useSWRMutation(
    ['deleteApplication', application.id],
    ([_key, id]) => deleteApplication(id),
    {
      onSuccess: () => {
        toast.success('Umsókn eytt', { toastId: 'delete-application-success' })
        mutate('getMyApplications')
      },
      onError: () => {
        toast.error(`Ekki tókst að eyða umsókn`, {
          toastId: 'delete-application-error',
        })
      },
    },
  )

  const statusText =
    application.status === ApplicationDtoStatusEnum.DRAFT
      ? 'Í vinnslu'
      : 'Innsend'

  const applicationUrl =
    application.type === ApplicationDtoTypeEnum.InnköllunÞrotabús
      ? `${PageRoutes.APPLICATION_THROTABU}/${application.caseId}`
      : ``

  return (
    <Box borderRadius="large" border="standard" padding={3} background="white">
      <Stack space={3}>
        <Inline justifyContent="spaceBetween">
          <Text variant="h3">{application.title}</Text>
          <Inline space={2} alignY="center">
            <Tag variant="blue">{statusText}</Tag>
            <button onClick={() => deleteApplicationTrigger()}>
              <Icon
                icon="trash"
                type="outline"
                size="small"
                color="roseTinted400"
              />
            </button>
          </Inline>
        </Inline>
        <Inline align="right">
          <LinkV2 href={applicationUrl}>
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
    </Box>
  )
}
