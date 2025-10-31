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
    additionalText: variables?.additionalText ?? prevData?.additionalText,
    commonFields: {
      ...prevData?.commonFields,
      ...variables?.commonFields,
    },
    courtAndJudgmentFields: {
      ...prevData?.courtAndJudgmentFields,
      ...variables?.courtAndJudgmentFields,
    },
    divisionMeetingFields: {
      ...prevData?.divisionMeetingFields,
      ...variables?.divisionMeetingFields,
    },
    liquidatorFields: {
      ...prevData?.liquidatorFields,
      ...variables?.liquidatorFields,
    },
    settlementFields: {
      ...prevData?.settlementFields,
      ...variables?.settlementFields,
    },
    signature: {
      ...prevData?.signature,
      ...variables?.signature,
    },
    publishingDates: variables?.publishingDates
      ? variables?.publishingDates.map(({ publishingDate }) => ({
          publishingDate: publishingDate,
        }))
      : prevData?.publishingDates,
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
        courtDistrictId === application?.courtAndJudgmentFields.courtDistrictId
      ) {
        return
      }

      updateApplication(
        { courtAndJudgmentFields: { courtDistrictId } },
        {
          successMessage: 'Dómstóll vistaður',
          errorMessage: 'Ekki tókst að uppfæra dómstól',
        },
      )
    },
    [updateApplication, application?.courtAndJudgmentFields.courtDistrictId],
  )

  const updateJudgmentDate = useCallback(
    (judgmentDate: string) => {
      if (judgmentDate === application?.courtAndJudgmentFields.judgmentDate) {
        return
      }

      updateApplication(
        { courtAndJudgmentFields: { judgmentDate } },
        {
          successMessage: 'Úrskurðardagur vistaður',
          errorMessage: 'Ekki tókst að uppfæra úrskurðardag',
        },
      )
    },
    [updateApplication, application?.courtAndJudgmentFields.judgmentDate],
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
        application?.divisionMeetingFields.meetingLocation
      ) {
        return
      }

      updateApplication(
        { divisionMeetingFields: { meetingLocation: divisionMeetingLocation } },
        {
          successMessage: 'Staðsetning skiptafundar vistuð',
          errorMessage: 'Ekki tókst að uppfæra staðsetningu skiptafundar',
        },
      )
    },
    [updateApplication, application?.divisionMeetingFields.meetingLocation],
  )

  const updateDivisionMeetingDate = useCallback(
    (divisionMeetingDate?: string | null) => {
      if (
        divisionMeetingDate === application?.divisionMeetingFields.meetingDate
      ) {
        return
      }

      updateApplication(
        {
          divisionMeetingFields: {
            meetingDate: divisionMeetingDate ?? undefined,
          },
        },
        {
          successMessage: 'Dagsetning skiptafundar vistuð',
          errorMessage: 'Ekki tókst að uppfæra dagsetningu skiptafundar',
        },
      )
    },
    [updateApplication, application?.divisionMeetingFields.meetingDate],
  )

  const updateLiquidatorName = useCallback(
    (liquidatorName: string) => {
      if (liquidatorName === application?.liquidatorFields.name) {
        return
      }

      updateApplication(
        { liquidatorFields: { name: liquidatorName } },
        {
          successMessage: 'Nafn skiptastjóra vistað',
          errorMessage: 'Ekki tókst að uppfæra nafn skiptastjóra',
        },
      )
    },
    [updateApplication, application?.liquidatorFields.name],
  )

  const updateLiquidatorLocation = useCallback(
    (liquidatorLocation: string) => {
      if (liquidatorLocation === application?.liquidatorFields.location) {
        return
      }

      updateApplication(
        { liquidatorFields: { location: liquidatorLocation } },
        {
          successMessage: 'Staðsetning skiptastjóra vistað',
          errorMessage: 'Ekki tókst að uppfæra staðsetningu skiptastjóra',
        },
      )
    },
    [updateApplication, application?.liquidatorFields.location],
  )

  const updateSettlementName = useCallback(
    (settlementName: string) => {
      if (settlementName === application?.settlementFields?.name) {
        return
      }

      updateApplication(
        { settlementFields: { name: settlementName } },
        {
          successMessage: 'Nafn þrotabús vistað',
          errorMessage: 'Ekki tókst að uppfæra nafn þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementFields?.name],
  )

  const updateSettlementNationalId = useCallback(
    (settlementNationalId: string) => {
      if (settlementNationalId === application?.settlementFields?.nationalId) {
        return
      }

      updateApplication(
        { settlementFields: { nationalId: settlementNationalId } },
        {
          successMessage: 'Kennitala þrotabús vistuð',
          errorMessage: 'Ekki tókst að uppfæra kennitölu þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementFields?.nationalId],
  )

  const updateSettlementAddress = useCallback(
    (settlementAddress: string) => {
      if (settlementAddress === application?.settlementFields.address) {
        return
      }

      updateApplication(
        { settlementFields: { address: settlementAddress } },
        {
          successMessage: 'Heimilisfang þrotabús vistað',
          errorMessage: 'Ekki tókst að uppfæra heimilisfang þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementFields?.address],
  )

  const updateSettlementDeadlineDate = useCallback(
    (settlementDeadlineDate?: string) => {
      if (
        settlementDeadlineDate === application?.settlementFields?.deadlineDate
      ) {
        return
      }

      updateApplication(
        { settlementFields: { deadlineDate: settlementDeadlineDate } },
        {
          successMessage: 'Frestdagur þrotabús vistaður',
          errorMessage: 'Ekki tókst að uppfæra frestdag þrotabús',
        },
      )
    },
    [updateApplication, application?.settlementFields?.deadlineDate],
  )

  const updateSettlementDateOfDeath = useCallback(
    (settlementDateOfDeath?: string) => {
      if (
        settlementDateOfDeath === application?.settlementFields?.dateOfDeath
      ) {
        return
      }

      updateApplication(
        { settlementFields: { dateOfDeath: settlementDateOfDeath } },
        {
          successMessage: 'Dánardagur vistaður',
          errorMessage: 'Ekki tókst að uppfæra dánardag',
        },
      )
    },
    [updateApplication, application?.settlementFields?.dateOfDeath],
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
