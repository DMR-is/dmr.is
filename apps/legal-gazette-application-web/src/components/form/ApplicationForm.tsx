'use client'

import { isBase64 } from 'class-validator'

import { ApplicationDetailedDto, ApplicationTypeEnum } from '../../gen/fetch'
import { CommonForm } from './common/CommonForm'
import { RecallForm } from './recall/RecallForm'

type OptionSchema = {
  label: string
  value: string
}

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
            type: application.applicationType,
            caseId: application.caseId,
            courtDistrictOptions: courtDistricts,
            typeOptions: types,
          }}
          fields={{
            ...application.commonFields,
            html: (() => {
              if (
                application.commonFields.html &&
                isBase64(application.commonFields.html)
              ) {
                return Buffer.from(
                  application.commonFields.html,
                  'base64',
                ).toString('utf-8')
              }

              return application.commonFields.html
            })(),
            type: application?.type,
          }}
          communicationChannels={application.communicationChannels}
          publishingDates={application.publishingDates}
          signature={application.signature}
          additionalText={application.additionalText}
        />
      )
    case ApplicationTypeEnum.RECALLBANKRUPTCY:
    case ApplicationTypeEnum.RECALLDECEASED:
      return (
        <RecallForm
          metadata={{
            applicationId: application.id,
            caseId: application.caseId,
            courtDistrictOptions: courtDistricts,
            typeOptions: types,
          }}
          fields={{
            ...application.recallFields,
            type: application.applicationType,
          }}
          communicationChannels={application.communicationChannels}
          publishingDates={application.publishingDates}
          signature={application.signature}
          additionalText={application.additionalText}
        />
      )
    default:
      throw new Error('Unsupported application type')
  }
}
