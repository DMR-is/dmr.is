import { useCallback } from 'react'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AdvertDetailedDto } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

type UseUpdateSignature = {
  advertId: string
  signatureId: string
}
export const useUpdateSignature = ({
  advertId,
  signatureId,
}: UseUpdateSignature) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: advert } = useSuspenseQuery(
    trpc.getAdvert.queryOptions({ id: advertId }),
  )

  const { mutate: updateSignatureMutation, isPending: isUpdating } =
    useMutation(
      trpc.updateSignature.mutationOptions({
        onMutate: async (variables) => {
          await queryClient.cancelQueries(
            trpc.getAdvert.queryFilter({ id: advertId }),
          )

          const prevData = queryClient.getQueryData(
            trpc.getAdvert.queryKey({ id: advertId }),
          ) as AdvertDetailedDto

          if (!prevData.signature) {
            return { prevData }
          }

          const optimisticData: AdvertDetailedDto = {
            ...prevData,
            signature: {
              ...prevData.signature,
              name: variables.name ?? prevData.signature?.name,
              onBehalfOf:
                variables.onBehalfOf ?? prevData.signature?.onBehalfOf,
              location: variables.location ?? prevData.signature?.location,
              date: variables.date ?? prevData.signature?.date,
            },
          }

          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: advertId }),
            optimisticData,
          )

          return { prevData }
        },
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries(
            trpc.getAdvert.queryFilter({ id: variables.advertId }),
          )
          queryClient.invalidateQueries(trpc.getPublication.queryFilter())
          toast.success('Undirritun vistuð', {
            toastId: 'update-signature-success',
          })
        },
        onError: (_error, variables, context) => {
          toast.error('Ekki tókst að vista undirritun', {
            toastId: 'update-signature-error',
          })

          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: variables.advertId }),
            context?.prevData,
          )
        },
      }),
    )

  const updateSignatureName = useCallback(
    (name?: string | null) => {
      if (name === advert?.signature?.name) {
        return
      }

      return updateSignatureMutation({
        advertId: advertId,
        signatureId: signatureId,
        name,
      })
    },
    [updateSignatureMutation, advert?.signature?.name, signatureId, advertId],
  )

  const updateSignatureOnBehalfOf = useCallback(
    (onBehalfOf?: string | null) => {
      if (onBehalfOf === advert?.signature?.onBehalfOf) {
        return
      }

      return updateSignatureMutation({
        advertId: advertId,
        signatureId: signatureId,
        onBehalfOf,
      })
    },
    [
      updateSignatureMutation,
      advert?.signature?.onBehalfOf,
      signatureId,
      advertId,
    ],
  )

  const updateSignatureLocation = useCallback(
    (location?: string | null) => {
      if (location === advert?.signature?.location) {
        return
      }

      return updateSignatureMutation({
        advertId: advertId,
        signatureId: signatureId,
        location,
      })
    },
    [
      updateSignatureMutation,
      advert?.signature?.location,
      signatureId,
      advertId,
    ],
  )

  const updateSignatureDate = useCallback(
    (date?: string | null) => {
      if (date === advert?.signature?.date) {
        return
      }

      return updateSignatureMutation({
        advertId: advertId,
        signatureId: signatureId,
        date,
      })
    },
    [updateSignatureMutation, advert?.signature?.date, signatureId, advertId],
  )

  return {
    updateSignatureMutation,
    updateSignatureName,
    updateSignatureOnBehalfOf,
    updateSignatureLocation,
    updateSignatureDate,
    isUpdating,
  }
}
