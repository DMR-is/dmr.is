'use client'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  advertId: string
  canEdit: boolean
}

export const CreateSignatureField = ({ advertId, canEdit }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutate: createSignatureMutation, isPending } = useMutation(
    trpc.createSignature.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )
      },
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: advertId }),
        )
        queryClient.invalidateQueries(trpc.getPublication.queryFilter())
        toast.success('Undirritun bætt við', {
          toastId: 'update-signature-success',
        })
      },
      onError: () => {
        toast.error('Villa við að bæta undirritun við', {
          toastId: 'update-signature-error',
        })
      },
    }),
  )

  return (
    <Stack space={[2, 3]}>
      <Text>Undirritun fannst ekki á auglýsingu</Text>
      <Button
        disabled={!canEdit}
        loading={isPending}
        variant="ghost"
        size="small"
        onClick={() => createSignatureMutation({ advertId })}
        icon="pencil"
      >
        Bæta við undirritun
      </Button>
    </Stack>
  )
}
