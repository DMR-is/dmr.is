import { useCallback } from 'react'

import { CommunicationChannelSchema } from '@dmr.is/legal-gazette/schemas'
import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is'

import { ApplicationDetailedDto, UpdateApplicationDto } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const createOptimisticUpdateForApplication = (
  prevData: ApplicationDetailedDto,
  variables: UpdateApplicationDto,
): ApplicationDetailedDto => {
  return {
    ...prevData,
    ...variables,
    commonFields: {
      ...prevData.commonFields,
      ...variables.commonFields,
    },
    recallFields: {
      ...prevData.recallFields,
      ...variables.recallFields,
    },
  }
}

export type UpdateOptions = {
  successMessage?: string
  errorMessage?: string
}

export const useUpdateApplication = (applicationId: string) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: application } = useSuspenseQuery(
    trpc.getApplicationById.queryOptions({ id: applicationId }),
  )

  const { mutate: updateApplicationMutation } = useMutation(
    trpc.updateApplication.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.getApplicationById.queryFilter({
            id: applicationId,
          }),
        )

        const prevData = queryClient.getQueryData(
          trpc.getApplicationById.queryKey({
            id: applicationId,
          }),
        )

        const optimisticData = createOptimisticUpdateForApplication(
          prevData as ApplicationDetailedDto,
          variables as UpdateApplicationDto,
        )

        queryClient.setQueryData(
          trpc.getApplicationById.queryKey({
            id: applicationId,
          }),
          optimisticData,
        )

        return prevData
      },
    }),
  )

  const updateApplication = useCallback(
    (data: UpdateApplicationDto, options: UpdateOptions = {}) => {
      const { successMessage, errorMessage } = options

      return updateApplicationMutation(
        {
          id: applicationId,
          ...data,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(
              trpc.getApplicationById.queryFilter({
                id: applicationId,
              }),
            )
            if (successMessage) {
              toast.success(successMessage, {
                toastId: 'update-application-success',
              })
            }
          },
          onError: (_error, _variables, context) => {
            if (context) {
              queryClient.setQueryData(
                trpc.getApplicationById.queryKey({
                  id: applicationId,
                }),
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

  const updateSignatureName = useCallback(
    (signatureName: string) => {
      if (signatureName === application?.signature?.name) {
        return
      }

      updateApplication(
        { signature: { name: signatureName } },
        {
          successMessage: 'Nafn undirritara vistað',
          errorMessage: 'Ekki tókst að uppfæra nafn undirritara',
        },
      )
    },
    [updateApplication, application?.signature?.name],
  )

  const updateSignatureLocation = useCallback(
    (signatureLocation: string) => {
      if (signatureLocation === application?.signature?.location) {
        return
      }

      updateApplication(
        {
          signature: { location: signatureLocation },
        },
        {
          successMessage: 'Staðsetning undirritara vistuð',
          errorMessage: 'Ekki tókst að uppfæra staðsetningu undirritara',
        },
      )
    },
    [updateApplication, application?.signature?.location],
  )

  const updateSignatureDate = useCallback(
    (signatureDate: string) => {
      if (signatureDate === application?.signature?.date) {
        return
      }

      updateApplication(
        { signature: { date: signatureDate } },
        {
          successMessage: 'Dagsetning undirritunar vistuð',
          errorMessage: 'Ekki tókst að uppfæra dagsetningu undirritunar',
        },
      )
    },
    [updateApplication, application?.signature?.date],
  )

  const updateSignatureOnBehalfOf = useCallback(
    (signatureOnBehalfOf: string) => {
      if (signatureOnBehalfOf === application?.signature?.onBehalfOf) {
        return
      }

      updateApplication(
        {
          signature: { onBehalfOf: signatureOnBehalfOf },
        },
        {
          successMessage: 'Undirritun fyrir hönd vistað',
          errorMessage: 'Ekki tókst að uppfæra undirritun fyrir hönd',
        },
      )
    },
    [updateApplication, application?.signature?.onBehalfOf],
  )

  const updatePublishingDates = useCallback(
    (publishingDates: string[]) => {
      if (
        JSON.stringify(publishingDates) ===
        JSON.stringify(application?.publishingDates)
      ) {
        return
      }

      updateApplication(
        {
          publishingDates: publishingDates.map((date) => ({
            publishingDate: date,
          })),
        },
        {
          successMessage: 'Birtingardagsetningar vistaðar',
          errorMessage: 'Ekki tókst að uppfæra birtingardagsetningar',
        },
      )
    },
    [updateApplication, application?.publishingDates],
  )

  const updateCommunicationChannels = useCallback(
    (channels: CommunicationChannelSchema[]) => {
      if (
        JSON.stringify(channels) ===
        JSON.stringify(application?.communicationChannels)
      ) {
        return
      }

      updateApplication(
        { communicationChannels: channels },
        {
          successMessage: 'Samskiptaleiðir vistaðar',
          errorMessage: 'Ekki tókst að uppfæra samskiptaleiðir',
        },
      )
    },
    [updateApplication, application?.communicationChannels],
  )

  const updateAdditionalText = useCallback(
    (additionalText: string) => {
      if (additionalText === application?.additionalText) {
        return
      }

      updateApplication(
        { additionalText },
        {
          successMessage: 'Frjáls texti vistaður',
          errorMessage: 'Ekki tókst að uppfæra frjálsan texta',
        },
      )
    },
    [updateApplication, application?.additionalText],
  )

  return {
    updateApplication,
    updateSignatureName,
    updateSignatureLocation,
    updateSignatureDate,
    updateSignatureOnBehalfOf,
    updatePublishingDates,
    updateCommunicationChannels,
    updateAdditionalText,
  }
}
