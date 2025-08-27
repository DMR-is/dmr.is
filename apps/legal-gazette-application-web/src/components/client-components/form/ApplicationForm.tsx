'use client'

import { ApplicationDetailedDto, ApplicationTypeEnum } from '../../../gen/fetch'
import { CommonForm } from './common/CommonForm'
import { RecallForm } from './recall/RecallForm'

export type Props = {
  caseId: string
  application: ApplicationDetailedDto
  categories: { label: string; value: string }[]
  courtDistricts: { label: string; value: string }[]
}

export const ApplicationForm = ({
  application,
  categories,
  courtDistricts,
}: Props) => {
  switch (application.applicationType) {
    case ApplicationTypeEnum.COMMON:
      return (
        <CommonForm
          fields={{
            caption: application.caption ?? undefined,
            category: application.category?.id,
            html: application.html ?? undefined,
            publishingDates: application.publishingDates?.map(
              (d) => new Date(d),
            ),
            communicationChannels: application.communicationChannels ?? [],
            signatureDate: application.signatureDate
              ? new Date(application.signatureDate)
              : undefined,
            signatureLocation: application.signatureLocation ?? undefined,
            signatureName: application.signatureName ?? undefined,
          }}
          categories={categories}
          applicationId={application.id}
          caseId={application.id}
        />
      )
    case ApplicationTypeEnum.RECALLBANKRUPTCY:
    case ApplicationTypeEnum.RECALLDECEASED:
      return (
        <RecallForm
          fields={{
            recallType:
              application.applicationType ===
              ApplicationTypeEnum.RECALLBANKRUPTCY
                ? 'bankruptcy'
                : 'deceased',
            additionalText: application.additionalText ?? undefined,
            communicationChannels: application.communicationChannels,
            courtId: application.courtDistrictId ?? undefined,
            judgementDate: application.judgmentDate
              ? new Date(application.judgmentDate)
              : undefined,
            divisionMeetingDate: application.divisionMeetingDate
              ? new Date(application.divisionMeetingDate)
              : undefined,
            divisionMeetingLocation:
              application.divisionMeetingLocation ?? undefined,

            settlementName: application.settlementName ?? undefined,
            settlementNationalId: application.settlementNationalId ?? undefined,
            settlementAddress: application.settlementAddress ?? undefined,
            settlementDateOfDeath: application.settlementDateOfDeath
              ? new Date(application.settlementDateOfDeath)
              : undefined,
            settlementDeadline: application.settlementDeadlineDate
              ? new Date(application.settlementDeadlineDate)
              : undefined,
            liquidatorName: application.liquidatorName ?? undefined,
            liquidatorLocation: application.liquidatorLocation ?? undefined,
            liquidatorOnBehalfOf: application.liquidatorOnBehalfOf ?? undefined,
            publishingDates: application.publishingDates.map(
              (d) => new Date(d),
            ),
            signatureDate: application.signatureDate
              ? new Date(application.signatureDate)
              : undefined,
            signatureLocation: application.signatureLocation ?? undefined,
          }}
          applicationId={application.id}
          caseId={application.id}
          courtOptions={courtDistricts}
        />
      )
    default:
      throw new Error('Unsupported application type')
  }
}
