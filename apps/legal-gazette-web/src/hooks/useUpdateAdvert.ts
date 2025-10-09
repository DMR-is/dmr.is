import { useCallback } from 'react'

import { toast } from '@dmr.is/ui/components/island-is'

import { UpdateAdvertDto } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type UpdateOptions = {
  successMessage?: string
  errorMessage?: string
}

export const useUpdateAdvert = (id: string) => {
  const mutation = trpc.adverts.updateAdvert.useMutation()
  const utils = trpc.useUtils()

  const updateAdvert = useCallback(
    (data: UpdateAdvertDto, options: UpdateOptions = {}) => {
      const { successMessage, errorMessage = 'Villa við að vista breytingar' } =
        options

      return mutation.mutate(
        { id, ...data },
        {
          onSuccess: () => {
            if (successMessage) {
              toast.success(successMessage)
            }
            utils.adverts.getAdvert.invalidate({ id })
          },
          onError: () => {
            toast.error(errorMessage)
          },
        },
      )
    },
    [id, mutation],
  )

  const updateTitle = useCallback(
    (title: string) =>
      updateAdvert(
        { title },
        {
          successMessage: 'Yfirskrift vistuð',
          errorMessage: 'Villa við að vista yfirskrift',
        },
      ),
    [updateAdvert],
  )

  const updateCaption = useCallback(
    (caption: string) =>
      updateAdvert(
        { caption },
        {
          successMessage: 'Yfirskrift vistuð',
          errorMessage: 'Villa við að vista yfirskrift',
        },
      ),
    [updateAdvert],
  )

  const updateContent = useCallback(
    ({ content }: { content: string }) =>
      updateAdvert(
        { content },
        {
          successMessage: 'Yfirskrift vistuð',
          errorMessage: 'Villa við að vista yfirskrift',
        },
      ),
    [updateAdvert],
  )

  return {
    updateAdvert,
    updateCaption,
    updateContent,
    updateTitle,
  }
}
