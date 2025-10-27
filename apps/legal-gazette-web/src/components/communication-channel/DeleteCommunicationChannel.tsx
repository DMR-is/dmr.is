import { Button, toast } from '@dmr.is/ui/components/island-is'

import { AdvertDetailedDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/nTrpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  advertId: string
  channelId: string
}

export const DeleteCommunicationChannel = ({ advertId, channelId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: deleteChannel, isPending: isDeletingChannel } = useMutation(
    trpc.deleteChannel.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )

        const prevData = queryClient.getQueryData(
          trpc.getAdvert.queryKey({ id: advertId }),
        ) as AdvertDetailedDto

        const currentChannels = prevData?.communicationChannels ?? []

        const newChannels = currentChannels.filter(
          (channel) => channel.id !== variables.channelId,
        )

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.advertId }),
          {
            ...prevData,
            communicationChannels: newChannels,
          },
        )

        return prevData
      },
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )
      },
      onError: (_, variables, mutateResults) => {
        toast.error('Ekki tókst að eyða samskiptaleið')
        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.advertId }),
          mutateResults,
        )
      },
    }),
  )

  return (
    <Button
      icon="trash"
      size="small"
      circle
      loading={isDeletingChannel}
      colorScheme="destructive"
      onClick={() => deleteChannel({ advertId, channelId })}
    />
  )
}
