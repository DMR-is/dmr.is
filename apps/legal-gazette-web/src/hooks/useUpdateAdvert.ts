import { useCallback } from 'react'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is'

import {
  AdvertDetailedDto,
  CategoryDto,
  CourtDistrictDto,
  StatusDto,
  StatusIdEnum,
  TypeDto,
  UpdateAdvertDto,
} from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type UpdateOptions = {
  successMessage?: string
  errorMessage?: string
}

const createOptimisticDataForAdvert = (
  prevData: AdvertDetailedDto,
  variables: UpdateAdvertDto,
  types: TypeDto[],
  categories: CategoryDto[],
  courtDistricts: CourtDistrictDto[],
): AdvertDetailedDto => {
  const filteredVariables = Object.fromEntries(
    Object.entries(variables).filter(([_, value]) => value !== null),
  )

  const { typeId, categoryId, courtDistrictId, scheduledAt, ...rest } =
    filteredVariables

  const type = types.find((type) => type.id === typeId)
  const category = categories.find((category) => category.id === categoryId)
  const courtDistrict = courtDistricts.find(
    (courtDistrict) => courtDistrict.id === courtDistrictId,
  )
  return {
    ...prevData,
    ...rest,
    scheduledAt:
      Array.isArray(scheduledAt) && scheduledAt.length > 0
        ? scheduledAt[0]
        : prevData.scheduledAt,
    type: type ?? prevData.type,
    category: category ?? prevData.category,
    courtDistrict: courtDistrict ?? prevData.courtDistrict,
  }
}

export const useUpdateAdvert = (id: string) => {
  const trpc = useTRPC()
  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))

  // We fetch this to map type, category and courtDistrict to the optimistic data
  const { data: entities } = useSuspenseQuery(
    trpc.getAllEntities.queryOptions(),
  )
  const types = entities?.types || []
  const categories = entities?.categories || []
  const courtDistricts = entities?.courtDistricts || []
  const statuses = entities?.statuses || []

  const queryClient = useQueryClient()

  const { mutate: moveToNextStatusMutation, isPending: isMovingToNextStatus } =
    useMutation(
      trpc.moveToNextStatus.mutationOptions({
        onMutate: async (variables) => {
          await queryClient.cancelQueries(
            trpc.getAdvert.queryFilter({ id: variables.id }),
          )
          const prevData = queryClient.getQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
          ) as AdvertDetailedDto

          const currentStatus = prevData.status
          let nextStatus: StatusIdEnum

          switch (currentStatus.id) {
            case StatusIdEnum.SUBMITTED: {
              nextStatus = StatusIdEnum.IN_PROGRESS
              break
            }
            case StatusIdEnum.IN_PROGRESS: {
              nextStatus = StatusIdEnum.READY_FOR_PUBLICATION
              break
            }
            default:
              nextStatus = currentStatus.id
              break
          }

          const status = statuses.find((status) => status.id === nextStatus)
          if (!status) {
            return prevData
          }

          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
            {
              ...prevData,
              status: status as StatusDto,
            },
          )
          return prevData
        },
        onSuccess: (_, variables) => {
          toast.success('Staða auglýsingar uppfærð', {
            toastId: 'changeAdvertStatus',
          })
          queryClient.invalidateQueries(
            trpc.getAdvert.queryFilter({ id: variables.id }),
          )
        },
        onError: (error, variables, mutateResults) => {
          toast.error('Ekki tókst að uppfæra stöðu auglýsingar', {
            toastId: 'changeAdvertStatusError',
          })
          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
            mutateResults,
          )
        },
      }),
    )

  const {
    mutate: moveToPreviousStatusMutation,
    isPending: isMovingToPreviousStatus,
  } = useMutation(
    trpc.moveToPreviousStatus.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.getAdvert.queryFilter({ id: variables.id }),
        )
        const prevData = queryClient.getQueryData(
          trpc.getAdvert.queryKey({ id: variables.id }),
        ) as AdvertDetailedDto

        const currentStatus = prevData.status
        let prevStatus: StatusIdEnum

        switch (currentStatus.id) {
          case StatusIdEnum.READY_FOR_PUBLICATION: {
            prevStatus = StatusIdEnum.IN_PROGRESS
            break
          }
          case StatusIdEnum.IN_PROGRESS: {
            prevStatus = StatusIdEnum.SUBMITTED
            break
          }
          default:
            prevStatus = currentStatus.id
            break
        }

        const status = statuses.find((status) => status.id === prevStatus)
        if (!status) {
          return prevData
        }

        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.id }),
          {
            ...prevData,
            status: status as StatusDto,
          },
        )

        return prevData
      },
      onSuccess: (_, variables) => {
        toast.success('Staða auglýsingar uppfærð', {
          toastId: 'changeAdvertStatus',
        })
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: variables.id }),
        )
        queryClient.invalidateQueries(
          trpc.getComments.queryFilter({ advertId: variables.id }),
        )
      },
      onError: (_, variables, mutateResults) => {
        toast.error('Ekki tókst að uppfæra stöðu auglýsingar', {
          toastId: 'changeAdvertStatusError',
        })
        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.id }),
          mutateResults,
        )
      },
    }),
  )

  const { mutate: updateAdvertMutation, isPending: isUpdatingAdvert } =
    useMutation(
      trpc.updateAdvert.mutationOptions({
        onMutate: async (variables) => {
          await queryClient.cancelQueries(
            trpc.getAdvert.queryFilter({ id: variables.id }),
          )
          const prevData = queryClient.getQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
          ) as AdvertDetailedDto

          const optimisticData = createOptimisticDataForAdvert(
            prevData,
            variables,
            types,
            categories,
            courtDistricts,
          )
          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
            optimisticData,
          )
          return prevData
        },
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries(
            trpc.getAdvert.queryFilter({ id: variables.id }),
          )
        },
        onError: (_, variables, mutateResults) => {
          toast.error(
            'Ekki tókst að færa auglýsingu í stöðu tilbúin til útgáfu',
            {
              toastId: 'markAdvertAsReadyError',
            },
          )
          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
            mutateResults,
          )
        },
      }),
    )

  const { mutate: assignUserMutation, isPending: isAssigningUser } =
    useMutation(
      trpc.assignUser.mutationOptions({
        onMutate: async (variables) => {
          await queryClient.cancelQueries(
            trpc.getAdvert.queryFilter({ id: variables.id }),
          )
          const prevData = queryClient.getQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
          ) as AdvertDetailedDto

          return prevData
        },
        onSuccess: (_, variables) => {
          toast.success('Starfsmaður úthlutaður', {
            toastId: 'assignUserToAdvert',
          })
          queryClient.invalidateQueries(
            trpc.getAdvert.queryFilter({ id: variables.id }),
          )
        },
        onError: (_, variables, mutateResults) => {
          toast.error('Ekki tókst að úthluta starfsmanni', {
            toastId: 'assignUserToAdvertError',
          })
          queryClient.setQueryData(
            trpc.getAdvert.queryKey({ id: variables.id }),
            mutateResults,
          )
        },
      }),
    )

  const {
    mutate: assignAndUpdateStatus,
    isPending: isAssigningAndUpdatingStatus,
  } = useMutation(
    trpc.assignAndUpdateStatus.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries(
          trpc.getAdvert.queryFilter({ id: variables.id }),
        )
        const prevData = queryClient.getQueryData(
          trpc.getAdvert.queryKey({ id: variables.id }),
        ) as AdvertDetailedDto

        return prevData
      },
      onSuccess: (_, variables) => {
        toast.success('Starfsmaður úthlutaður', {
          toastId: 'assignUserToAdvert',
        })
        queryClient.invalidateQueries(
          trpc.getAdvert.queryFilter({ id: variables.id }),
        )
      },
      onError: (_, variables, mutateResults) => {
        toast.error('Ekki tókst að úthluta starfsmanni', {
          toastId: 'assignUserToAdvertError',
        })
        queryClient.setQueryData(
          trpc.getAdvert.queryKey({ id: variables.id }),
          mutateResults,
        )
      },
    }),
  )

  const updateAdvert = useCallback(
    (data: UpdateAdvertDto, options: UpdateOptions = {}) => {
      const {
        successMessage,
        errorMessage = 'Villa við að uppfæra breytingar',
      } = options
      return updateAdvertMutation(
        { id: id, ...data },
        {
          onSuccess: async () => {
            if (successMessage) {
              toast.success(successMessage)
            }

            await queryClient.invalidateQueries(
              trpc.getAdvert.queryFilter({ id }),
            )
          },
          onError: (_error, _variables, mutateResults) => {
            queryClient.setQueryData(
              trpc.getAdvert.queryKey({ id }),
              mutateResults,
            )
            toast.error(errorMessage)
          },
        },
      )
    },
    [id, updateAdvertMutation],
  )

  const assignUser = useCallback(
    (userId: string) => {
      if (userId === advert?.assignedUser) {
        return
      }
      return assignUserMutation({ id, userId })
    },
    [id, assignUserMutation, advert?.assignedUser],
  )

  const updateTitle = useCallback(
    (title: string) => {
      if (title === advert?.title) {
        return
      }

      updateAdvert(
        { title },
        {
          successMessage: 'Titill uppfærður',
          errorMessage: 'Villa við að uppfæra yfirskrift',
        },
      )
    },
    [updateAdvert, advert?.title],
  )

  const updateCaption = useCallback(
    (caption: string) => {
      if (caption === advert?.caption) {
        return
      }

      return updateAdvert(
        { caption },
        {
          successMessage: 'Yfirskrift uppfærð',
          errorMessage: 'Villa við að vista yfirskrift',
        },
      )
    },
    [updateAdvert, advert?.caption],
  )

  const updateContent = useCallback(
    ({ content }: { content: string }) => {
      if (content === advert?.content) {
        return
      }

      return updateAdvert(
        { content },
        {
          successMessage: 'Efni uppfært',
          errorMessage: 'Villa við að uppfæra efni',
        },
      )
    },
    [updateAdvert, advert?.content],
  )

  const updateAdditionalText = useCallback(
    ({ additionalText }: { additionalText: string }) => {
      if (additionalText === advert?.additionalText) {
        return
      }
      return updateAdvert(
        { additionalText },
        {
          successMessage: 'Frjáls texti uppfærður',
          errorMessage: 'Villa við að uppfæra yfirskrift',
        },
      )
    },
    [updateAdvert, advert?.additionalText],
  )

  const updateType = useCallback(
    (typeId: string) => {
      if (typeId === advert?.type.id) {
        return
      }
      return updateAdvert(
        { typeId },
        {
          successMessage: 'Tegund uppfærð',
          errorMessage: 'Villa við að uppfæra tegund',
        },
      )
    },
    [updateAdvert, advert?.type.id],
  )

  const updateCategory = useCallback(
    (categoryId?: string) => {
      if (categoryId === advert?.category.id) {
        return
      }

      return updateAdvert(
        { categoryId },
        {
          successMessage: 'Flokkur uppfærður',
          errorMessage: 'Villa við að uppfæra flokk',
        },
      )
    },
    [updateAdvert, advert?.category.id],
  )

  const updateSignatureName = useCallback(
    (signatureName?: string) => {
      if (signatureName === advert?.signatureName) {
        return
      }

      return updateAdvert(
        { signatureName },
        {
          successMessage: 'Nafn undirritara uppfært',
          errorMessage: 'Villa við að uppfæra nafn undirritara',
        },
      )
    },
    [updateAdvert, advert?.signatureName],
  )

  const updateSignatureOnBehalfOf = useCallback(
    (signatureOnBehalfOf: string) => {
      if (signatureOnBehalfOf === advert?.signatureOnBehalfOf) {
        return
      }

      updateAdvert(
        { signatureOnBehalfOf },
        {
          successMessage: 'Fyrir hönd uppfært',
          errorMessage: 'Villa við að uppfæra fyrir hönd',
        },
      )
    },
    [updateAdvert, advert?.signatureOnBehalfOf],
  )

  const updateSignatureLocation = useCallback(
    (signatureLocation: string) => {
      if (signatureLocation === advert?.signatureLocation) {
        return
      }

      updateAdvert(
        { signatureLocation },
        {
          successMessage: 'Staður undirritunar uppfærður',
          errorMessage: 'Villa við að uppfæra stað undirritunar',
        },
      )
    },
    [updateAdvert, advert?.signatureLocation],
  )

  const updateSignatureDate = useCallback(
    (signatureDate: string) => {
      if (signatureDate === advert?.signatureDate) {
        return
      }

      updateAdvert(
        { signatureDate },
        {
          successMessage: 'Dagsetning undirritunar uppfærð',
          errorMessage: 'Villa við að uppfæra dagsetningu undirritunar',
        },
      )
    },
    [updateAdvert, advert?.signatureDate],
  )

  const updateCourtDistrict = useCallback(
    (courtDistrictId: string) => {
      if (courtDistrictId === advert?.courtDistrict?.id) {
        return
      }

      return updateAdvert(
        { courtDistrictId },
        {
          successMessage: 'Dómstóll uppfærður',
          errorMessage: 'Villa við að uppfæra dómstól',
        },
      )
    },
    [updateAdvert, advert?.courtDistrict?.id],
  )

  const updateJudgementDay = useCallback(
    (judgementDate: string) => {
      if (judgementDate === advert?.judgementDate) {
        return
      }

      updateAdvert(
        { judgementDate },
        {
          successMessage: 'Úrskurðadagur uppfærður',
          errorMessage: 'Villa við að uppfæra úrskurðardag',
        },
      )
    },
    [updateAdvert, advert?.judgementDate],
  )

  const updateDivisionMeetingLocation = useCallback(
    (divisionMeetingLocation: string) => {
      if (divisionMeetingLocation === advert?.divisionMeetingLocation) {
        return
      }

      return updateAdvert(
        { divisionMeetingLocation },
        {
          successMessage: 'Staðsetning skiptafundar uppfærð',
          errorMessage: 'Villa við að uppfæra staðsetningu skiptafundar',
        },
      )
    },
    [updateAdvert, advert?.divisionMeetingLocation],
  )

  const updateDivisionMeetingDate = useCallback(
    (divisionMeetingDate: string) => {
      if (divisionMeetingDate === advert?.divisionMeetingDate) {
        return
      }

      return updateAdvert(
        { divisionMeetingDate },
        {
          successMessage: 'Dagsetning skiptafundar uppfærð',
          errorMessage: 'Villa við að uppfæra dagsetningu skiptafundar',
        },
      )
    },
    [updateAdvert, advert?.divisionMeetingDate],
  )

  const moveToNextStatus = useCallback(() => {
    moveToNextStatusMutation({ id })
  }, [id, moveToNextStatusMutation])

  const moveToPreviousStatus = useCallback(() => {
    moveToPreviousStatusMutation({ id })
  }, [id, moveToPreviousStatusMutation])

  return {
    isUpdatingAdvert,
    isMovingToNextStatus,
    isMovingToPreviousStatus,
    isAssigningUser,
    isAssigningAndUpdatingStatus,
    assignAndUpdateStatus,
    moveToNextStatus,
    moveToPreviousStatus,
    assignUser,
    updateTitle,
    updateCaption,
    updateContent,
    updateAdditionalText,
    updateType,
    updateCategory,
    updateSignatureName,
    updateSignatureOnBehalfOf,
    updateSignatureLocation,
    updateSignatureDate,
    updateCourtDistrict,
    updateJudgementDay,
    updateDivisionMeetingLocation,
    updateDivisionMeetingDate,
  }
}
