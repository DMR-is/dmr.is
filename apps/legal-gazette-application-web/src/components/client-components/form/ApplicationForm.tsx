'use client'

import { OptionSchema } from '@dmr.is/legal-gazette/schemas'

import { ApplicationDetailedDto, ApplicationTypeEnum } from '../../../gen/fetch'
import { CommonForm } from './common/CommonForm'
import { RecallForm } from './recall/RecallForm'

export type Props = {
  application: ApplicationDetailedDto
  types: OptionSchema[]
  courtDistricts: OptionSchema[]
}

export const ApplicationForm = ({
  application,
  courtDistricts,
  types,
}: Props) => {
  switch (application.applicationType) {
    case ApplicationTypeEnum.COMMON:
      return (
        <CommonForm
          metadata={{
            applicationId: application.id,
            caseId: application.caseId,
            courtDistrictOptions: courtDistricts,
            typeOptions: types,
          }}
          fields={{
            ...application.commonFields,
            html: (() => {
              if (application.commonFields.html) {
                return Buffer.from(
                  application.commonFields.html,
                  'base64',
                ).toString('utf-8')
              }

              return ''
            })(),
          }}
          communicationChannels={application.communicationChannels}
          publishingDates={application.publishingDates.map(
            ({ publishingDate }) => ({
              publishingDate: new Date(publishingDate),
            }),
          )}
          signature={{
            ...application.signature,
            date: application.signature?.date
              ? new Date(application.signature.date)
              : undefined,
          }}
        />
      )
    case ApplicationTypeEnum.RECALLBANKRUPTCY:
    case ApplicationTypeEnum.RECALLDECEASED:
      return (
        <RecallForm
          applicationId={application.id}
          caseId={application.caseId}
          courtOptions={courtDistricts}
          fields={{
            recallType:
              application.applicationType ===
              ApplicationTypeEnum.RECALLBANKRUPTCY
                ? 'bankruptcy'
                : 'deceased',
            additionalText: application.additionalText,
            communicationChannels: application.communicationChannels,
            courtId: application.courtAndJudgmentFields.courtDistrictId,
            judgementDate: application.courtAndJudgmentFields.judgmentDate
              ? new Date(application.courtAndJudgmentFields.judgmentDate)
              : undefined,
            divisionMeetingDate: application.divisionMeetingFields?.meetingDate
              ? new Date(application.divisionMeetingFields.meetingDate)
              : undefined,
            divisionMeetingLocation:
              application.divisionMeetingFields.meetingLocation,
            settlementName: application.settlementFields.name,
            settlementNationalId: application.settlementFields.nationalId,
            settlementAddress: application.settlementFields.address,
            settlementDateOfDeath: application.settlementFields.dateOfDeath
              ? new Date(application.settlementFields.dateOfDeath)
              : undefined,
            settlementDeadline: application.settlementFields.deadlineDate
              ? new Date(application.settlementFields.deadlineDate)
              : undefined,
            liquidatorName: application.liquidatorFields.name,
            liquidatorLocation: application.liquidatorFields.location,
            signatureName: application.signature?.name,
            signatureDate: application.signature?.date
              ? new Date(application.signature.date)
              : undefined,
            signatureLocation: application.signature?.location,
            signatureOnBehalfOf: application.signature?.onBehalfOf,
            publishingDates: application.publishingDates.map(
              ({ publishingDate }) => new Date(publishingDate),
            ),
          }}
        />
      )
    default:
      throw new Error('Unsupported application type')
  }
}
