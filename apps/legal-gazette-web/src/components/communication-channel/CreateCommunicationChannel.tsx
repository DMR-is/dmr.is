'use client'

import { isEmail } from 'class-validator'
import { useMemo, useState } from 'react'

import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
  toast,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import {
  AdvertDetailedDto,
  CreateCommunicationChannelDto,
} from '../../gen/fetch'
import { useToggle } from '../../hooks/useToggle'
import { useTRPC } from '../../lib/nTrpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  advertId: string
}

export const CreateCommunicationChannel = ({ advertId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [toggle, setToggle] = useToggle(false)

  const [createState, setCreateState] = useState<CreateCommunicationChannelDto>(
    {
      email: '',
      name: undefined,
      phone: undefined,
    },
  )

  const isDisabled = useMemo(
    () => isEmail(createState.email) === false,
    [createState.email],
  )

  const { mutate: createChannel, isPending: isCreatingChannel } = useMutation(
    trpc.createChannel.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )

        setCreateState({ email: '', name: undefined, phone: undefined })
        setToggle(false)
      },
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )

        const prevData = queryClient.getQueryData(
          trpc.getAdvert.queryKey({ id: advertId }),
        ) as AdvertDetailedDto

        const currentChannels = prevData?.communicationChannels ?? []

        const newChannels = [
          ...currentChannels,
          {
            advertId: variables.advertId,
            id: 'temp-id',
            email: createState.email,
            name: createState.name,
            phone: createState.phone,
          },
        ]

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.advertId }),
          {
            ...prevData,
            communicationChannels: newChannels,
          },
        )

        return prevData
      },
      onError: (_, variables, mutateResults) => {
        toast.error('Ekki tókst að bæta við samskiptaleið')
        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.advertId }),
          mutateResults,
        )
      },
    }),
  )

  return (
    <>
      <Modal
        baseId="create-communication-channel"
        isVisible={toggle}
        onVisibilityChange={setToggle}
        title="Bæta við samskiptaleið"
        disclosure={
          <Button
            icon="add"
            size="small"
            circle
            onClick={() => setToggle((prev) => !prev)}
          />
        }
      >
        <GridContainer>
          <GridRow rowGap={3}>
            <GridColumn span={['12/12']}>
              <Input
                required
                name="new-channel-email"
                label="Netfang"
                size="sm"
                backgroundColor="blue"
                value={createState.email}
                onChange={(e) =>
                  setCreateState((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <Input
                name="new-channel-name"
                label="Nafn"
                size="sm"
                backgroundColor="blue"
                value={createState.name}
                onChange={(e) =>
                  setCreateState((prev) => ({
                    ...prev,
                    name: e.target.value || undefined,
                  }))
                }
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <Input
                name="new-channel-phone"
                label="Símanúmer"
                size="sm"
                backgroundColor="blue"
                value={createState.phone}
                onChange={(e) =>
                  setCreateState((prev) => ({
                    ...prev,
                    phone: e.target.value || undefined,
                  }))
                }
              />
            </GridColumn>
            <GridColumn span={['12/12']}>
              <Inline align="right">
                <Button
                  loading={isCreatingChannel}
                  disabled={isDisabled}
                  onClick={() => createChannel({ advertId, ...createState })}
                >
                  Bæta við samskiptaleið
                </Button>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Modal>
    </>
  )
}
