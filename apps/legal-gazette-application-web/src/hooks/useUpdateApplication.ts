import { useCallback } from 'react'

import { CommunicationChannelSchema } from '@dmr.is/legal-gazette/schemas'
import { toast } from '@dmr.is/ui/components/island-is'

import { ApplicationDetailedDto, UpdateApplicationDto } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

const createOptimisticUpdateForApplication = (
  prevData: ApplicationDetailedDto,
  variables: UpdateApplicationDto,
): ApplicationDetailedDto => {
  return {
    ...prevData,
    ...variables,
    recallFields: {
      ...prevData.recallFields,
      ...variables.recallFields,
      courtAndJudgmentFields: {
        ...prevData.recallFields?.courtAndJudgmentFields,
        ...variables.recallFields?.courtAndJudgmentFields,
      },
      divisionMeetingFields: {
        ...prevData.recallFields?.divisionMeetingFields,
        ...variables.recallFields?.divisionMeetingFields,
      },
      liquidatorFields: {
        ...prevData.recallFields?.liquidatorFields,
        ...variables.recallFields?.liquidatorFields,
      },
      settlementFields: {
        ...prevData.recallFields?.settlementFields,
        ...variables.recallFields?.settlementFields,
      },
    },
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
          variables as UpdateApplicationDto,
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
        {
          id: applicationId,
          ...data,
        },
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
      if (!typeId || typeId === application?.commonFields.typeId) {
        return
      }

      updateApplication(
        { commonFields: { typeId: typeId } },
        {
          successMessage: 'Tegund vistuð',
          errorMessage: 'Ekki tókst að uppfæra tegund',
        },
      )
    },
    [updateApplication, application?.commonFields.typeId],
  )

  const updateCategory = useCallback(
    (categoryId?: string) => {
      if (!categoryId || categoryId === application?.commonFields.categoryId) {
        return
      }

      updateApplication(
        { commonFields: { categoryId: categoryId } },
        {
          successMessage: 'Flokkur vistaður',
          errorMessage: 'Ekki tókst að uppfæra flokk',
        },
      )
    },
    [updateApplication, application?.commonFields.categoryId],
  )

  const updateCaption = useCallback(
    (caption: string) => {
      if (caption === application?.commonFields.caption) {
        return
      }

      updateApplication(
        { commonFields: { caption: caption } },
        {
          successMessage: 'Yfirskrift vistuð',
          errorMessage: 'Ekki tókst að uppfæra yfirskrift',
        },
      )
    },
    [updateApplication, application?.commonFields.caption],
  )

  const updateHTML = useCallback(
    (html: string) => {
      const asBase64 = Buffer.from(html).toString('base64')

      if (asBase64 === application?.commonFields.html) {
        return
      }

      updateApplication(
        { commonFields: { html: asBase64 } },
        {
          successMessage: 'Meginmál vistað',
          errorMessage: 'Ekki tókst að uppfæra meginmál',
        },
      )
    },
    [updateApplication, application?.commonFields.html],
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

  const updateCourtDistrict = useCallback(
    (courtDistrictId?: string) => {
      if (
        !courtDistrictId ||
        courtDistrictId ===
          application?.recallFields?.courtAndJudgmentFields?.courtDistrictId
      ) {
        return
      }

      updateApplication(
        { recallFields: { courtAndJudgmentFields: { courtDistrictId } } },
        {
          successMessage: 'Dómstóll vistaður',
          errorMessage: 'Ekki tókst að uppfæra dómstól',
        },
      )
    },
    [
      updateApplication,
      application?.recallFields?.courtAndJudgmentFields?.courtDistrictId,
    ],
  )

  const updateJudgmentDate = useCallback(
    (judgementDate: string) => {
      if (
        judgementDate ===
        application?.recallFields?.courtAndJudgmentFields?.judgmentDate
      ) {
        return
      }

      updateApplication(
        {
          recallFields: {
            courtAndJudgmentFields: { judgmentDate: judgementDate },
          },
        },
        {
          successMessage: 'Úrskurðardagur vistaður',
          errorMessage: 'Ekki tókst að uppfæra úrskurðardag',
        },
      )
    },
    [
      updateApplication,
      application?.recallFields?.courtAndJudgmentFields?.judgmentDate,
    ],
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
      if (
        divisionMeetingLocation ===
        application?.recallFields?.divisionMeetingFields?.meetingLocation
      ) {
        return
      }

      updateApplication(
        {
          recallFields: {
            divisionMeetingFields: { meetingLocation: divisionMeetingLocation },
          },
        },
        {
          successMessage: 'Staðsetning skiptafundar vistuð',
          errorMessage: 'Ekki tókst að uppfæra staðsetningu skiptafundar',
        },
      )
    },
    [
      updateApplication,
      application?.recallFields?.divisionMeetingFields?.meetingLocation,
    ],
  )

  const updateDivisionMeetingDate = useCallback(
    (divisionMeetingDate?: string | null) => {
      if (
        divisionMeetingDate ===
        application?.recallFields?.divisionMeetingFields?.meetingDate
      ) {
        return
      }

      updateApplication(
        {
          recallFields: {
            divisionMeetingFields: {
              meetingDate: divisionMeetingDate ?? undefined,
            },
          },
        },
        {
          successMessage: 'Dagsetning skiptafundar vistuð',
          errorMessage: 'Ekki tókst að uppfæra dagsetningu skiptafundar',
        },
      )
    },
    [
      updateApplication,
      application?.recallFields?.divisionMeetingFields?.meetingDate,
    ],
  )

  const updateLiquidatorName = useCallback(
    (liquidatorName: string) => {
      if (
        liquidatorName === application?.recallFields?.liquidatorFields?.name
      ) {
        return
      }

      updateApplication(
        { recallFields: { liquidatorFields: { name: liquidatorName } } },
        {
          successMessage: 'Nafn skiptastjóra vistað',
          errorMessage: 'Ekki tókst að uppfæra nafn skiptastjóra',
        },
      )
    },
    [updateApplication, application?.recallFields?.liquidatorFields?.name],
  )

  const updateLiquidatorLocation = useCallback(
    (liquidatorLocation: string) => {
      if (
        liquidatorLocation ===
        application?.recallFields?.liquidatorFields?.location
      ) {
        return
      }

      updateApplication(
        {
          recallFields: { liquidatorFields: { location: liquidatorLocation } },
        },
        {
          successMessage: 'Staðsetning skiptastjóra vistað',
          errorMessage: 'Ekki tókst að uppfæra staðsetningu skiptastjóra',
        },
      )
    },
    [updateApplication, application?.recallFields?.liquidatorFields?.location],
  )

  const updateSettlementName = useCallback(
    (settlementName: string) => {
      if (
        settlementName === application?.recallFields?.settlementFields?.name
      ) {
        return
      }

      updateApplication(
        { recallFields: { settlementFields: { name: settlementName } } },
        {
          successMessage: 'Nafn þrotabús vistað',
          errorMessage: 'Ekki tókst að uppfæra nafn þrotabús',
        },
      )
    },
    [updateApplication, application?.recallFields?.settlementFields?.name],
  )

  const updateSettlementNationalId = useCallback(
    (settlementNationalId: string) => {
      if (
        settlementNationalId ===
        application?.recallFields?.settlementFields?.nationalId
      ) {
        return
      }

      updateApplication(
        {
          recallFields: {
            settlementFields: { nationalId: settlementNationalId },
          },
        },
        {
          successMessage: 'Kennitala þrotabús vistuð',
          errorMessage: 'Ekki tókst að uppfæra kennitölu þrotabús',
        },
      )
    },
    [
      updateApplication,
      application?.recallFields?.settlementFields?.nationalId,
    ],
  )

  const updateSettlementAddress = useCallback(
    (settlementAddress: string) => {
      if (
        settlementAddress ===
        application?.recallFields?.settlementFields?.address
      ) {
        return
      }

      updateApplication(
        { recallFields: { settlementFields: { address: settlementAddress } } },
        {
          successMessage: 'Heimilisfang þrotabús vistað',
          errorMessage: 'Ekki tókst að uppfæra heimilisfang þrotabús',
        },
      )
    },
    [updateApplication, application?.recallFields?.settlementFields?.address],
  )

  const updateSettlementDeadlineDate = useCallback(
    (settlementDeadlineDate?: string) => {
      if (
        settlementDeadlineDate ===
        application?.recallFields?.settlementFields?.deadlineDate
      ) {
        return
      }

      updateApplication(
        {
          recallFields: {
            settlementFields: { deadlineDate: settlementDeadlineDate },
          },
        },
        {
          successMessage: 'Frestdagur þrotabús vistaður',
          errorMessage: 'Ekki tókst að uppfæra frestdag þrotabús',
        },
      )
    },
    [
      updateApplication,
      application?.recallFields?.settlementFields?.deadlineDate,
    ],
  )

  const updateSettlementDateOfDeath = useCallback(
    (settlementDateOfDeath?: string) => {
      if (
        settlementDateOfDeath ===
        application?.recallFields?.settlementFields?.dateOfDeath
      ) {
        return
      }

      updateApplication(
        {
          recallFields: {
            settlementFields: { dateOfDeath: settlementDateOfDeath },
          },
        },
        {
          successMessage: 'Dánardagur vistaður',
          errorMessage: 'Ekki tókst að uppfæra dánardag',
        },
      )
    },
    [
      updateApplication,
      application?.recallFields?.settlementFields?.dateOfDeath,
    ],
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
    updateSettlementName,
    updateSettlementNationalId,
    updateSettlementAddress,
    updateSettlementDeadlineDate,
    updateSettlementDateOfDeath,
  }
}
