import { z } from 'zod'

import {
  communicationChannelSchema,
  formSchema,
  optionSchema,
  publishingDateSchema,
} from './shared'

export const recallFormMetaSchema = z.object({
  caseId: z.string(),
  applicationId: z.string(),
  courtOptions: z.array(optionSchema),
})

export const recallFormFieldsSchema = z
  .object({
    recallType: z.enum(['bankruptcy', 'deceased']), // hidden input used for validation
    courtId: z.uuid('Staður er nauðsynlegur'),
    judgementDate: z.date('Úrskurðar dagsetning er nauðsynleg'),
    additionalText: z.string().optional(),
    settlementName: z.string().min(1, 'Nafn bús er nauðsynlegt'),
    settlementNationalId: z.string().min(1, 'Kennitala bús er nauðsynleg'),
    settlementAddress: z.string().min(1, 'Heimilisfang bús er nauðsynlegt'),
    settlementDeadline: z.date('Frestdagur bús er nauðsynlegur').optional(),
    settlementDateOfDeath: z
      .date('Dánardagur dánarbús er nauðsynlegur')
      .optional(),
    liquidatorName: z.string().min(1, 'Nafn skiptastjóra er nauðsynlegt'),
    liquidatorLocation: z
      .string()
      .min(1, 'Staðsetning skiptastjóra er nauðsynleg'),
    signatureName: z.string().optional(),
    signatureDate: z.date().optional(),
    signatureLocation: z.string().optional(),
    signatureOnBehalfOf: z.string().optional(),
    divisionMeetingDate: z.date().optional(),
    divisionMeetingLocation: z.string().optional(),
    publishingDates: z
      .array(publishingDateSchema)
      .refine(
        (dates) => dates.length > 0,
        'Að minnsta kosti ein dagsetning fyrir birtingu er nauðsynleg',
      ),
    communicationChannels: z
      .array(communicationChannelSchema)
      .refine(
        (val) => val.length > 0,
        'Að minnsta kosti ein samskiptaleið er nauðsynleg',
      ),
  })
  .refine(
    ({ recallType, settlementDeadline }) => {
      if (recallType === 'bankruptcy') return settlementDeadline !== undefined
      return true
    },
    {
      path: ['settlementDeadline'],
      message: 'Frestdagur bús er nauðsynlegur',
    },
  )
  .refine(
    ({ recallType, settlementDateOfDeath }) => {
      if (recallType === 'deceased') return settlementDateOfDeath !== undefined
      return true
    },
    {
      path: ['settlementDateOfDeath'],
      message: 'Dánardagur dánarbús er nauðsynlegur',
    },
  )
  .refine(
    ({ recallType, divisionMeetingDate, divisionMeetingLocation }) => {
      if (recallType === 'bankruptcy') {
        return (
          divisionMeetingDate !== undefined &&
          divisionMeetingLocation !== undefined
        )
      }
      return true
    },
    {
      path: ['divisionMeetingDate', 'divisionMeetingLocation'],
      message: 'Upplýsingar um skiptafund eru nauðsynlegar',
    },
  )
  .refine(
    ({ recallType, divisionMeetingDate, divisionMeetingLocation }) => {
      if (recallType === 'deceased') {
        const bothUndefined =
          divisionMeetingDate === undefined &&
          divisionMeetingLocation === undefined

        const bothSet =
          divisionMeetingDate !== undefined &&
          divisionMeetingLocation !== undefined

        return bothUndefined || bothSet
      }
      return true
    },
    {
      path: ['divisionMeetingDate', 'divisionMeetingLocation'],
      message: 'Upplýsingar um skiptafund eru nauðsynlegar',
    },
  )

export const recallFormSchema = formSchema(
  recallFormMetaSchema,
  recallFormFieldsSchema,
)

export type RecallFormMetaSchema = z.infer<typeof recallFormMetaSchema>

export type RecallFormFieldsSchema = z.infer<typeof recallFormFieldsSchema>

export type RecallFormSchema = z.infer<typeof recallFormSchema>

export enum RecallFormFields {
  COURT_ID = 'fields.courtId',
  JUDGEMENT_DATE = 'fields.judgementDate',
  ADDITIONAL_TEXT = 'fields.additionalText',
  SETTLEMENT_NAME = 'fields.settlementName',
  SETTLEMENT_NATIONAL_ID = 'fields.settlementNationalId',
  SETTLEMENT_ADDRESS = 'fields.settlementAddress',
  SETTLEMENT_DEADLINE = 'fields.settlementDeadline',
  SETTLEMENT_DATE_OF_DEATH = 'fields.settlementDateOfDeath',
  LIQUIDATOR_NAME = 'fields.liquidatorName',
  LIQUIDATOR_LOCATION = 'fields.liquidatorLocation',
  DIVISION_MEETING_LOCATION = 'fields.divisionMeetingLocation',
  DIVISION_MEETING_DATE = 'fields.divisionMeetingDate',
  SIGNATURE_NAME = 'fields.signatureName',
  SIGNATURE_LOCATION = 'fields.signatureLocation',
  SIGNATURE_ON_BEHALF_OF = 'fields.signatureOnBehalfOf',
  SIGNATURE_DATE = 'fields.signatureDate',
  PUBLISHING_DATES = 'fields.publishingDates',
  COMMUNICATION_CHANNELS = 'fields.communicationChannels',
}
