import { useCallback } from 'react'

import { toast } from '@dmr.is/ui/components/island-is'

import { ApplicationDetailedDto, UpdateApplicationDto } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

const createOptimisticUpdateForApplication = (
  prevData: ApplicationDetailedDto,
  variables: UpdateApplicationDto,
) => {
  return {
    ...prevData,
    ...variables,
  }
}

type UpdateOptions = {
  successMessage?: string
  errorMessage?: string
}

export const useUpdateApplication = (applicationId: string) => {
  const utils = trpc.useUtils()
  const { data: application } = trpc.applicationApi.getApplicationById.useQuery(
    { id: applicationId },
    { enabled: !!applicationId },
  )

  const { mutate: updateApplicationMutation } =
    trpc.applicationApi.updateApplication.useMutation({
      onMutate: async (variables) => {
        await utils.applicationApi.getApplicationById.cancel({
          id: applicationId,
        })

        const prevData = utils.applicationApi.getApplicationById.getData({
          id: applicationId,
        })

        const optimisticData = createOptimisticUpdateForApplication(
          prevData as ApplicationDetailedDto,
          variables,
        )

        utils.applicationApi.getApplicationById.setData(
          { id: applicationId },
          optimisticData,
        )

        return prevData
      },
    })

  const updateApplication = useCallback(
    (data: UpdateApplicationDto, options: UpdateOptions = {}) => {
      const { successMessage, errorMessage } = options

      return updateApplicationMutation(
        { id: applicationId, ...data },
        {
          onSuccess: () => {
            utils.applicationApi.getApplicationById.invalidate({
              id: applicationId,
            })
            if (successMessage) {
              toast.success(successMessage, {
                toastId: 'update-application-success',
              })
            }
          },
          onError: (_error, _variables, context) => {
            if (context) {
              utils.applicationApi.getApplicationById.setData(
                { id: applicationId },
                context,
              )
            }
            if (errorMessage) {
              toast.error(errorMessage, {
                toastId: 'update-application-error',
              })
            }
          },
        },
      )
    },
    [updateApplicationMutation, applicationId],
  )

  const updateType = useCallback(
    (typeId?: string) => {
      if (!typeId || typeId === application?.typeId) {
        return
      }

      updateApplication(
        { typeId: typeId },
        {
          successMessage: 'Tegund vistuð',
          errorMessage: 'Ekki tókst að uppfæra tegund',
        },
      )
    },
    [updateApplication],
  )

  const updateCategory = useCallback(
    (categoryId?: string) => {
      if (!categoryId || categoryId === application?.categoryId) {
        return
      }

      updateApplication(
        { categoryId: categoryId },
        {
          successMessage: 'Flokkur vistaður',
          errorMessage: 'Ekki tókst að uppfæra flokk',
        },
      )
    },
    [updateApplication],
  )

  const updateCaption = useCallback(
    (caption: string) => {
      if (caption === application?.caption) {
        return
      }

      updateApplication(
        { caption: caption },
        {
          successMessage: 'Yfirskrift vistuð',
          errorMessage: 'Ekki tókst að uppfæra yfirskrift',
        },
      )
    },
    [updateApplication],
  )

  const updateHTML = useCallback(
    (html: string) => {
      if (html === application?.html) {
        return
      }

      const asBase64 = Buffer.from(html).toString('base64')

      updateApplication(
        { html: asBase64 },
        {
          successMessage: 'Meginmál vistað',
          errorMessage: 'Ekki tókst að uppfæra meginmál',
        },
      )
    },
    [updateApplication],
  )

  return {
    updateType,
    updateCategory,
    updateCaption,
    updateHTML,
  }
}
