'use client'

import { toast } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type BulkPublishOptions = {
  onSuccess?: () => void
  successMessage?: string
  errorMessage?: string
}

/**
 * Shared hook for bulk publishing adverts
 */
export const useBulkPublish = (options?: BulkPublishOptions) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: publishNextBulk, isPending } = useMutation(
    trpc.publishNextBulk.mutationOptions({
      onMutate: async ({ advertIds }) => {
        const count = advertIds.length
        const noun = count === 1 ? 'birtingu' : 'birtingar'
        toast.info(`Birti ${count} ${noun}...`, {
          toastId: 'publishing-adverts',
        })
      },
      onSuccess: (_data, { advertIds }) => {
        const count = advertIds.length
        toast.success(
          options?.successMessage || `Birting fyrir ${count} tókst`,
          {
            toastId: 'publish-adverts-success',
          },
        )

        // Invalidate all related queries (parameterless form)
        queryClient.invalidateQueries(trpc.getAdvertsCount.queryFilter())
        queryClient.invalidateQueries(
          trpc.getInPublishingAdverts.queryFilter(),
        )
        queryClient.invalidateQueries(
          trpc.getReadyForPublicationAdverts.queryFilter(),
        )

        options?.onSuccess?.()
      },
      onError: () => {
        toast.error(
          options?.errorMessage || 'Ekki tókst að birta auglýsingar',
          {
            toastId: 'publish-adverts-error',
          },
        )
      },
    }),
  )

  return {
    publishNextBulk,
    isPending,
  }
}
