import { useCallback } from 'react'

import { UpdateRecallFieldsDto } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'
import { UpdateOptions, useUpdateApplication } from './useUpdateApplication'

export const useUpdateRecallApplication = (applicationId: string) => {
  const { updateApplication } = useUpdateApplication(applicationId)
  const { data: application } = trpc.applicationApi.getApplicationById.useQuery(
    { id: applicationId },
    { enabled: !!applicationId },
  )

  const updateRecallApplication = useCallback(
    (data: UpdateRecallFieldsDto, options?: UpdateOptions) => {
      updateApplication(
        { recallFields: data },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [applicationId, updateApplication],
  )

  const updateCourtDistrict = useCallback(
    (courtDistrictId?: string, options?: UpdateOptions) => {
      if (
        courtDistrictId ===
        application?.recallFields.courtAndJudgmentFields.courtDistrictId
      ) {
        return
      }

      updateRecallApplication(
        { courtAndJudgmentFields: { courtDistrictId } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.courtAndJudgmentFields.courtDistrictId,
    ],
  )

  const updateJudgmentDate = useCallback(
    (judgmentDate: string, options?: UpdateOptions) => {
      if (
        judgmentDate ===
        application?.recallFields.courtAndJudgmentFields.judgmentDate
      ) {
        return
      }

      updateRecallApplication(
        { courtAndJudgmentFields: { judgmentDate } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.courtAndJudgmentFields.judgmentDate,
    ],
  )

  const updateDivisionMeetingDate = useCallback(
    (meetingDate: string | null, options?: UpdateOptions) => {
      if (
        meetingDate ===
        application?.recallFields.divisionMeetingFields.meetingDate
      ) {
        return
      }

      updateRecallApplication(
        { divisionMeetingFields: { meetingDate: meetingDate ?? undefined } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.divisionMeetingFields.meetingDate,
    ],
  )

  const updateDivisionMeetingLocation = useCallback(
    (meetingLocation: string, options?: UpdateOptions) => {
      if (
        meetingLocation ===
        application?.recallFields.divisionMeetingFields.meetingLocation
      ) {
        return
      }

      updateRecallApplication(
        { divisionMeetingFields: { meetingLocation } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.divisionMeetingFields.meetingLocation,
    ],
  )

  const updateLiquidatorName = useCallback(
    (name: string, options?: UpdateOptions) => {
      if (name === application?.recallFields.liquidatorFields.name) {
        return
      }

      updateRecallApplication(
        { liquidatorFields: { name } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [updateRecallApplication, application?.recallFields.liquidatorFields.name],
  )

  const updateLiquidatorLocation = useCallback(
    (location: string, options?: UpdateOptions) => {
      if (location === application?.recallFields.liquidatorFields.location) {
        return
      }

      updateRecallApplication(
        { liquidatorFields: { location } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.liquidatorFields.location,
    ],
  )

  const updateSettlementName = useCallback(
    (name: string, options?: UpdateOptions) => {
      if (name === application?.recallFields.settlementFields.name) {
        return
      }

      updateRecallApplication(
        { settlementFields: { name } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [updateRecallApplication, application?.recallFields.settlementFields.name],
  )

  const updateSettlementNationalId = useCallback(
    (nationalId: string, options?: UpdateOptions) => {
      if (
        nationalId === application?.recallFields.settlementFields.nationalId
      ) {
        return
      }

      updateRecallApplication(
        { settlementFields: { nationalId } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.settlementFields.nationalId,
    ],
  )

  const updateSettlementAddress = useCallback(
    (address: string, options?: UpdateOptions) => {
      if (address === application?.recallFields.settlementFields.address) {
        return
      }

      updateRecallApplication(
        { settlementFields: { address } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.settlementFields.address,
    ],
  )

  const updateSettlementDeadlineDate = useCallback(
    (deadlineDate: string, options?: UpdateOptions) => {
      if (
        deadlineDate === application?.recallFields.settlementFields.deadlineDate
      ) {
        return
      }

      updateRecallApplication(
        { settlementFields: { deadlineDate } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.settlementFields.deadlineDate,
    ],
  )

  const updateSettlementDateOfDeath = useCallback(
    (dateOfDeath: string, options?: UpdateOptions) => {
      if (
        dateOfDeath === application?.recallFields.settlementFields.dateOfDeath
      ) {
        return
      }

      updateRecallApplication(
        { settlementFields: { dateOfDeath } },
        {
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        },
      )
    },
    [
      updateRecallApplication,
      application?.recallFields.settlementFields.dateOfDeath,
    ],
  )

  return {
    updateRecallApplication,
    updateCourtDistrict,
    updateJudgmentDate,
    updateDivisionMeetingDate,
    updateDivisionMeetingLocation,
    updateLiquidatorName,
    updateLiquidatorLocation,
    updateSettlementName,
    updateSettlementNationalId,
    updateSettlementAddress,
    updateSettlementDeadlineDate,
    updateSettlementDateOfDeath,
  }
}
