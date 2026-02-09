import { isEmail } from 'class-validator'
import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'

import { AdvertDetailedDto, CommunicationChannelDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  advertId: string
  channel: CommunicationChannelDto
}

export const UpdateCommunicationChannel = ({
  advertId,
  channel: communicationChannel,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: updateCommunicationChannel } = useMutation(
    trpc.updateChannel.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )
      },
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )

        const prevData = queryClient.getQueryData(
          trpc.getAdvert.queryKey({ id: advertId }),
        ) as AdvertDetailedDto

        const currentChannels = prevData?.communicationChannels ?? []

        const updatedChannels = currentChannels.map((channel) =>
          channel.id === communicationChannel.id
            ? {
                ...channel,
                email: variables.email ?? channel.email,
                name: variables.name ?? channel.name,
                phone: variables.phone ?? channel.phone,
              }
            : channel,
        )

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.advertId }),
          {
            ...prevData,
            communicationChannels: updatedChannels,
          },
        )

        return prevData
      },
      onError: (_err, _variables, mutateResults) => {
        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: advertId }),
          mutateResults,
        )
      },
    }),
  )

  const updateHandler = useCallback(
    debounce((key: string, value: string) => {
      updateCommunicationChannel({
        advertId,
        channelId: communicationChannel.id,
        [key]: value,
      })
    }, 500),
    [advertId, communicationChannel.id, updateCommunicationChannel],
  )

  return (
    <Box paddingY={4} paddingX={2}>
      <GridContainer>
        <GridRow rowGap={3}>
          <GridColumn span={['12/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              label="Netfang"
              name="channel-email"
              defaultValue={communicationChannel.email}
              onChange={(e) => {
                updateHandler.cancel()
                if (isEmail(e.target.value)) {
                  updateHandler('email', e.target.value)
                }
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              label="Nafn"
              name="channel-name"
              defaultValue={communicationChannel.name}
              onChange={(e) => updateHandler('name', e.target.value)}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              label="Símanúmer"
              name="channel-phone"
              defaultValue={communicationChannel.phone}
              onChange={(e) => updateHandler('phone', e.target.value)}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
