import addDays from 'date-fns/addDays'
import { UseFormProps } from 'react-hook-form'

import { RecallApplicationDto } from '../../gen/fetch'
import {
  BankruptcyFormSchema,
  bankruptcyFormSchema,
} from './schemas/recall-schema'

import { zodResolver } from '@hookform/resolvers/zod'

type Params = {
  caseId: string
  applicationId: string
  courtOptions: { label: string; value: string }[]
  application: RecallApplicationDto
}

export const recallForm = ({
  caseId,
  applicationId,
  courtOptions,
  application,
}: Params): UseFormProps<BankruptcyFormSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(bankruptcyFormSchema),
  defaultValues: {
    meta: {
      caseId,
      applicationId,
      courtOptions,
    },
    advert: {
      courtId: application.courtDistrict?.id,
      additionalText: application.additionalText,
      judgementDate: application.judgmentDate
        ? new Date(application.judgmentDate)
        : undefined,
    },
    divisionMeeting: {
      date: application.settlementMeetingDate
        ? new Date(application.settlementMeetingDate)
        : undefined,
      location: application.settlementMeetingLocation,
    },
    liquidator: {
      name: application.liquidator,
      location: application.liquidatorLocation,
      onBehalfOf: application.liquidatorOnBehalfOf,
    },
    settlement: {
      name: application.settlementName,
      nationalId: application.settlementNationalId,
      address: application.settlementAddress,
      deadline: application.settlementDeadline
        ? new Date(application.settlementDeadline)
        : undefined,
      dateOfDeath: application.settlementDateOfDeath
        ? new Date(application.settlementDateOfDeath)
        : undefined,
    },
    signature: {
      date: application.signatureDate
        ? new Date(application.signatureDate)
        : undefined,
      location: application.signatureLocation,
    },
    publishing: application.publishingDates
      ? application.publishingDates.map((date) => new Date(date))
      : [addDays(new Date(), 14)],
  },
})
