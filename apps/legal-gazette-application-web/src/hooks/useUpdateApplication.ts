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
    [updateApplication, application?.typeId],
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
    [updateApplication, application?.categoryId],
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
    [updateApplication, application?.caption],
  )

  const updateHTML = useCallback(
    (html: string) => {
      const asBase64 = Buffer.from(html).toString('base64')

      if (asBase64 === application?.html) {
        return
      }

      updateApplication(
        { html: asBase64 },
        {
          successMessage: 'Meginmál vistað',
          errorMessage: 'Ekki tókst að uppfæra meginmál',
        },
      )
    },
    [updateApplication, application?.html],
  )

  const updateSignatureName = useCallback(
    (signatureName: string) => {
      if (signatureName === application?.signature?.name) {
        return
      }

      updateApplication(
        { signature: { ...application?.signature, name: signatureName } },
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
          signature: { ...application?.signature, location: signatureLocation },
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
        { signature: { ...application?.signature, date: signatureDate } },
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
          signature: {
            ...application?.signature,
            onBehalfOf: signatureOnBehalfOf,
          },
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
        { publishingDates },
        {
          successMessage: 'Birtingardagsetningar vistaðar',
          errorMessage: 'Ekki tókst að uppfæra birtingardagsetningar',
        },
      )
    },
    [updateApplication, application?.publishingDates],
  )

  const updateCommunicationChannels = useCallback(
    (
      communicationChannels: {
        email: string
        name?: string | undefined
        phone?: string | undefined
      }[],
    ) => {
      // we need compare the values deeply since it's an array
      if (
        JSON.stringify(communicationChannels) ===
        JSON.stringify(application?.communicationChannels)
      ) {
        return
      }

      updateApplication(
        { communicationChannels },
        {
          successMessage: 'Samskiptaleiðir vistaðar',
          errorMessage: 'Ekki tókst að uppfæra samskiptaleiðir',
        },
      )
    },
    [updateApplication, application?.communicationChannels],
  )

  const updateCourtDistrict = useCallback(
    (courtDistrictId?: string) => {
      if (
        !courtDistrictId ||
        courtDistrictId === application?.courtDistrictId
      ) {
        return
      }

      updateApplication(
        { courtDistrictId },
        {
          successMessage: 'Dómstóll vistaður',
          errorMessage: 'Ekki tókst að uppfæra dómstól',
        },
      )
    },
    [updateApplication, application?.courtDistrictId],
  )

  const updateJudgmentDate = useCallback(
    (judgmentDate: string) => {
      if (judgmentDate === application?.judgmentDate) {
        return
      }

      updateApplication(
        { judgmentDate },
        {
          successMessage: 'Úrskurðardagur vistaður',
          errorMessage: 'Ekki tókst að uppfæra úrskurðardag',
        },
      )
    },
    [updateApplication, application?.judgmentDate],
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

  const updateDivisionMeetingLocation = useCallback(
    (divisionMeetingLocation: string) => {
      if (divisionMeetingLocation === application?.divisionMeetingLocation) {
        return
      }

      updateApplication(
        { divisionMeetingLocation },
        {
          successMessage: 'Staðsetning skiptafundar vistuð',
          errorMessage: 'Ekki tókst að uppfæra staðsetningu skiptafundar',
        },
      )
    },
    [updateApplication, application?.divisionMeetingLocation],
  )

  const updateDivisionMeetingDate = useCallback(
    (divisionMeetingDate?: string | null) => {
      if (divisionMeetingDate === application?.divisionMeetingDate) {
        return
      }

      updateApplication(
        { divisionMeetingDate },
        {
          successMessage: 'Dagsetning skiptafundar vistuð',
          errorMessage: 'Ekki tókst að uppfæra dagsetningu skiptafundar',
        },
      )
    },
    [updateApplication, application?.divisionMeetingDate],
  )

  const updateLiquidatorName = useCallback(
    (liquidatorName: string) => {
      if (liquidatorName === application?.liquidatorName) {
        return
      }

      updateApplication(
        { liquidatorName },
        {
          successMessage: 'Nafn skiptastjóra vistað',
          errorMessage: 'Ekki tókst að uppfæra nafn skiptastjóra',
        },
      )
    },
    [updateApplication, application?.liquidatorName],
  )

  const updateLiquidatorLocation = useCallback(
    (liquidatorLocation: string) => {
      if (liquidatorLocation === application?.liquidatorLocation) {
        return
      }

      updateApplication(
        { liquidatorLocation },
        {
          successMessage: 'Staðsetning skiptastjóra vistað',
          errorMessage: 'Ekki tókst að uppfæra staðsetningu skiptastjóra',
        },
      )
    },
    [updateApplication, application?.liquidatorLocation],
  )

  const updateLiquidatorOnBehalfOf = useCallback(
    (liquidatorOnBehalfOf: string) => {
      if (liquidatorOnBehalfOf === application?.liquidatorOnBehalfOf) {
        return
      }

      updateApplication(
        { liquidatorOnBehalfOf },
        {
          successMessage: 'Undirritun fyrir hönd skiptastjóra vistuð',
          errorMessage:
            'Ekki tókst að uppfæra undirritun fyrir hönd skiptastjóra',
        },
      )
    },
    [updateApplication, application?.liquidatorOnBehalfOf],
  )

  const updateSettlementName = useCallback(
    (settlementName: string) => {
      if (settlementName === application?.settlementName) {
        return
      }

      updateApplication(
        { settlementName },
        {
          successMessage: 'Nafn þrotabús vistað',
          errorMessage: 'Ekki tókst að uppfæra nafn þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementName],
  )

  const updateSettlementNationalId = useCallback(
    (settlementNationalId: string) => {
      if (settlementNationalId === application?.settlementNationalId) {
        return
      }

      updateApplication(
        { settlementNationalId },
        {
          successMessage: 'Kennitala þrotabús vistuð',
          errorMessage: 'Ekki tókst að uppfæra kennitölu þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementNationalId],
  )

  const updateSettlementAddress = useCallback(
    (settlementAddress: string) => {
      if (settlementAddress === application?.settlementAddress) {
        return
      }

      updateApplication(
        { settlementAddress },
        {
          successMessage: 'Heimilisfang þrotabús vistað',
          errorMessage: 'Ekki tókst að uppfæra heimilisfang þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementAddress],
  )

  const updateSettlementDeadlineDate = useCallback(
    (settlementDeadlineDate?: string) => {
      if (settlementDeadlineDate === application?.settlementDeadlineDate) {
        return
      }

      updateApplication(
        { settlementDeadlineDate },
        {
          successMessage: 'Frestdagur þrotabús vistaður',
          errorMessage: 'Ekki tókst að uppfæra frestdag þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementDeadlineDate],
  )

  const updateSettlementDateOfDeath = useCallback(
    (settlementDateOfDeath?: string) => {
      if (settlementDateOfDeath === application?.settlementDateOfDeath) {
        return
      }

      updateApplication(
        { settlementDateOfDeath },
        {
          successMessage: 'Dánardagur vistaður',
          errorMessage: 'Ekki tókst að uppfæra dánardag',
        },
      )
    },
    [updateApplication, application?.settlementDateOfDeath],
  )

  return {
    updateType,
    updateCategory,
    updateCaption,
    updateHTML,
    updateSignatureName,
    updateSignatureLocation,
    updateSignatureDate,
    updateSignatureOnBehalfOf,
    updatePublishingDates,
    updateCommunicationChannels,
    updateCourtDistrict,
    updateJudgmentDate,
    updateAdditionalText,
    updateDivisionMeetingLocation,
    updateDivisionMeetingDate,
    updateLiquidatorName,
    updateLiquidatorLocation,
    updateLiquidatorOnBehalfOf,
    updateSettlementName,
    updateSettlementNationalId,
    updateSettlementAddress,
    updateSettlementDeadlineDate,
    updateSettlementDateOfDeath,
  }
}
