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
    case (ApplicationTypeEnum.RECALLBANKRUPTCY,
    ApplicationTypeEnum.RECALLDECEASED):
      return (
        <RecallForm
          fields={{
            advert: {
              courtId: application.courtDistrictId ?? undefined,
              additionalText: application.additionalText ?? undefined,
              judgementDate: application.judgmentDate
                ? new Date(application.judgmentDate)
                : undefined,
            },
            divisionMeeting: {
              date: application.divisionMeetingDate
                ? new Date(application.divisionMeetingDate)
                : undefined,
              location: application.divisionMeetingLocation ?? undefined,
            },
            liquidator: {},
            publishing: application.publishingDates
              ? application.publishingDates.map((d) => new Date(d))
              : [],
            signature: {
              date: application.signatureDate
                ? new Date(application.signatureDate)
                : undefined,
              location: application.signatureLocation ?? undefined,
            },
            settlement: {
              address: application.settlementAddress ?? undefined,
              name: application.settlementName ?? undefined,
              nationalId: application.settlementNationalId ?? undefined,
              dateOfDeath: application.settlementDateOfDeath
                ? new Date(application.settlementDateOfDeath)
                : undefined,
              deadline: application.settlementDeadlineDate
                ? new Date(application.settlementDeadlineDate)
                : undefined,
            },
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
