import { Button, toast } from '@dmr.is/ui/components/island-is'

import { trpc } from '../../lib/trpc/client'

type Props = {
  advertId: string
  channelId: string
}

export const DeleteCommunicationChannel = ({ advertId, channelId }: Props) => {
  const utils = trpc.useUtils()

  const { mutate: deleteChannel, isPending: isDeletingChannel } =
    trpc.channelsApi.deleteChannel.useMutation({
      onMutate: async (variables) => {
        await utils.adverts.getAdvert.cancel({ id: advertId })

        const prevData = utils.adverts.getAdvert.getData({ id: advertId })

        const currentChannels = prevData?.communicationChannels ?? []

        const newChannels = currentChannels.filter(
          (channel) => channel.id !== variables.channelId,
        )

        utils.adverts.getAdvert.setData({ id: advertId }, (prev) =>
          prev
            ? {
                ...prev,
                communicationChannels: newChannels,
              }
            : undefined,
        )

        return prevData
      },
      onSuccess: () => {
        toast.success('Samskiptaleið var eytt')
        utils.adverts.getAdvert.invalidate({ id: advertId })
      },
      onError: (_, variables, mutateResults) => {
        toast.error('Ekki tókst að eyða samskiptaleið')
        utils.adverts.getAdvert.setData({ id: advertId }, mutateResults)
      },
    })

  return (
    <Button
      icon="trash"
      size="small"
      loading={isDeletingChannel}
      colorScheme="destructive"
      onClick={() => deleteChannel({ advertId, channelId })}
    />
  )
}
