import { useCallback } from 'react'

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
import { trpc } from '../lib/trpc/client'

type UpdateOptions = {
  successMessage?: string
  errorMessage?: string
}

// This can optimistic update everything except category, type and courDistrict
// TODO: If we fetch categories, types and courtDistricts, we can optimistic update them as well
const createOptimisticDataForAdvert = (
  prevData: AdvertDetailedDto,
  variables: UpdateAdvertDto,
  types: TypeDto[],
  categories: CategoryDto[],
  courtDistricts: CourtDistrictDto[],
): AdvertDetailedDto => {
  const { typeId, categoryId, courtDistrictId, ...rest } = variables

  const type = types.find((type) => type.id === typeId)
  const category = categories.find((category) => category.id === categoryId)
  const courtDistrict = courtDistricts.find(
    (courtDistrict) => courtDistrict.id === courtDistrictId,
  )
  return {
    ...prevData,
    ...rest,
    type: type ?? prevData.type,
    category: category ?? prevData.category,
    courtDistrict: courtDistrict ?? prevData.courtDistrict,
  }
}

export const useUpdateAdvert = (id: string) => {
  const [advert] = trpc.adverts.getAdvert.useSuspenseQuery({ id })

  // We fetch this to map type, category and courtDistrict to the optimistic data
  const [{ types, categories, courtDistricts, statuses }] =
    trpc.baseEntity.getAllEntities.useSuspenseQuery()

  const utils = trpc.useUtils()

  const {
    mutate: changeAdvertStatusMutation,
    isPending: isChangingAdvertStatus,
  } = trpc.adverts.changeAdvertStatus.useMutation({
    onMutate: async (variables) => {
      await utils.adverts.getAdvert.cancel({ id: variables.id })
      const prevData = utils.adverts.getAdvert.getData({
        id: variables.id,
      }) as AdvertDetailedDto

      const status =
        (statuses.find(
          (status) => status.id === variables.statusId,
        ) as StatusDto) ?? prevData.status
      const optimisticData = {
        ...prevData,
        status,
      }
      utils.adverts.getAdvert.setData({ id: variables.id }, optimisticData)
      return prevData
    },
    onSuccess: (_, variables) => {
      toast.success('Auglýsing fær stöðu tilbúin til útgáfu', {
        toastId: 'markAdvertAsReady',
      })
      utils.adverts.getAdvert.invalidate({ id: variables.id })
    },
    onError: (_, variables, mutateResults) => {
      toast.error('Ekki tókst að færa auglýsingu í stöðu tilbúin til útgáfu', {
        toastId: 'markAdvertAsReadyError',
      })
      utils.adverts.getAdvert.setData({ id: variables.id }, mutateResults)
    },
  })

  const { mutate: assignUserMutation } = trpc.adverts.assignUser.useMutation({
    onMutate: async (variables) => {
      const prevData = utils.adverts.getAdvert.getData({
        id: variables.id,
      }) as AdvertDetailedDto

      return prevData
    },
    onSuccess: (_, variables) => {
      toast.success('Starfsmaður úthlutaður', {
        toastId: 'assignUserToAdvert',
      })
      utils.adverts.getAdvert.invalidate({ id: variables.id })
    },
    onError: (_, variables, mutateResults) => {
      toast.error('Ekki tókst að úthluta starfsmanni', {
        toastId: 'assignUserToAdvertError',
      })
      utils.adverts.getAdvert.setData({ id: variables.id }, mutateResults)
    },
  })

  const { mutate: updateAdvertMutation, isPending: isUpdatingAdvert } =
    trpc.adverts.updateAdvert.useMutation({
      onMutate: async (variables) => {
        await utils.adverts.getAdvert.cancel({ id: variables.id })

        const prevData = utils.adverts.getAdvert.getData({
          id: variables.id,
        }) as AdvertDetailedDto

        const optimisticData = createOptimisticDataForAdvert(
          prevData,
          variables,
          types,
          categories,
          courtDistricts,
        )

        utils.adverts.getAdvert.setData({ id: variables.id }, optimisticData)

        // We return the previous data so that we can use it to revert the optimistic update
        return prevData
      },
    })

  const updateAdvert = useCallback(
    (data: UpdateAdvertDto, options: UpdateOptions = {}) => {
      const {
        successMessage,
        errorMessage = 'Villa við að uppfæra breytingar',
      } = options
      return updateAdvertMutation(
        { id, ...data },
        {
          onSuccess: async () => {
            if (successMessage) {
              toast.success(successMessage)
            }

            await utils.adverts.getAdvert.invalidate({ id })
          },
          onError: (_error, _variables, mutateResults) => {
            utils.adverts.getAdvert.setData({ id }, mutateResults)
            toast.error(errorMessage)
          },
        },
      )
    },
    [id, updateAdvertMutation],
  )

  const changeAdvertStatus = useCallback(
    (statusId: StatusIdEnum) => {
      if (statusId === advert.status.id) {
        return
      }
      return changeAdvertStatusMutation({ id, statusId })
    },
    [id, changeAdvertStatusMutation, advert.status.id],
  )

  const assignUser = useCallback(
    (userId: string) => {
      if (userId === advert.assignedUser) {
        return
      }
      return assignUserMutation({ id, userId })
    },
    [id, assignUserMutation, advert.assignedUser],
  )

  const updateTitle = useCallback(
    (title: string) => {
      if (title === advert.title) {
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
    [updateAdvert, advert.title],
  )

  const updateCaption = useCallback(
    (caption: string) => {
      if (caption === advert.caption) {
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
    [updateAdvert, advert.caption],
  )

  const updateContent = useCallback(
    ({ content }: { content: string }) => {
      if (content === advert.content) {
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
    [updateAdvert, advert.content],
  )

  const updateAdditionalText = useCallback(
    ({ additionalText }: { additionalText: string }) => {
      if (additionalText === advert.additionalText) {
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
    [updateAdvert, advert.additionalText],
  )

  const updateType = useCallback(
    (typeId: string) => {
      if (typeId === advert.type.id) {
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
    [updateAdvert, advert.type.id],
  )

  const updateCategory = useCallback(
    (categoryId?: string) => {
      if (categoryId === advert.category.id) {
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
    [updateAdvert, advert.category.id],
  )

  const updateSignatureName = useCallback(
    (signatureName?: string) => {
      if (signatureName === advert.signatureName) {
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
    [updateAdvert, advert.category.id],
  )

  const updateSignatureOnBehalfOf = useCallback(
    (signatureOnBehalfOf: string) => {
      if (signatureOnBehalfOf === advert.signatureOnBehalfOf) {
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
    [updateAdvert],
  )

  const updateSignatureLocation = useCallback(
    (signatureLocation: string) => {
      if (signatureLocation === advert.signatureLocation) {
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
    [updateAdvert],
  )

  const updateSignatureDate = useCallback(
    (signatureDate: string) => {
      if (signatureDate === advert.signatureDate) {
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
    [updateAdvert],
  )

  const updateCourtDistrict = useCallback(
    (courtDistrictId: string) => {
      if (courtDistrictId === advert.courtDistrict?.id) {
        return
      }

      return updateAdvert(
        { courtDistrictId },
        {
          successMessage: 'Tegund uppfærð',
          errorMessage: 'Villa við að uppfæra tegund',
        },
      )
    },
    [updateAdvert, advert.courtDistrict?.id],
  )

  const updateJudgementDay = useCallback(
    (judgementDate: string) => {
      if (judgementDate === advert.judgementDate) {
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
    [updateAdvert],
  )

  return {
    isUpdatingAdvert,
    changeAdvertStatus,
    isChangingAdvertStatus,
    assignUser,

    // Update fields
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
  }
}
