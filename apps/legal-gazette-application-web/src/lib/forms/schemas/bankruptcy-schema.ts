import { z } from 'zod'

export const bankruptcyFormMetaSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  applicationId: z.string().min(1, 'Application ID is required'),
  courtOptions: z.array(
    z.object({
      label: z.string().min(1, 'Court label is required'),
      value: z.string().min(1, 'Court value is required'),
    }),
  ),
})

export const bankruptcyAdvertSchema = z.object({
  courtId: z.uuid('Staður er nauðsynlegur'),
  judgementDate: z.date('Úrskurðar dagsetning er nauðsynleg'),
  additionalText: z.string().optional(),
})

export const bankruptcySettlementSchema = z.object({
  name: z.string().min(1, 'Nafn bús er nauðsynlegt'),
  nationalId: z.string().min(1, 'Kennitala bús er nauðsynleg'),
  address: z.string().min(1, 'Heimilisfang bús er nauðsynlegt'),
  deadline: z.date('Frestdagur bús er nauðsynlegur'),
})

export const liquidatorSchema = z.object({
  name: z.string().min(1, 'Nafn skiptastjóra er nauðsynlegt'),
  location: z.string().min(1, 'Staðsetning skiptastjóra er nauðsynleg'),
  onBehalfOf: z.string().optional(),
})

export const bankruptcyDivisionMeetingsSchema = z.object({
  date: z
    .date()
    .optional()
    .refine((date) => date !== undefined, {
      message: 'Dagsetning skiptafundar er nauðsynleg',
    }),
  location: z.string().min(1, 'Staðsetning skiptafundar er nauðsynleg'),
})

export const bankruptcySignatureSchema = z.object({
  date: z.date('Dagsetning undirritunar er nauðsynleg'),
  location: z.string().min(1, 'Staðsetning undirritunar er nauðsynleg'),
})

export const bankruptcyPublishingSchema = z
  .array(z.date('Dagsetning fyrir birtingu er nauðsynleg'))
  .refine(
    (dates) => dates.length > 0,
    'Að minnsta kosti ein dagsetning fyrir birtingu er nauðsynleg',
  )

export const bankruptcyFormSchema = z.object({
  meta: bankruptcyFormMetaSchema,
  advert: bankruptcyAdvertSchema,
  settlement: bankruptcySettlementSchema,
  liquidator: liquidatorSchema,
  divisionMeeting: bankruptcyDivisionMeetingsSchema,
  signature: bankruptcySignatureSchema,
  publishing: bankruptcyPublishingSchema,
})

export type BankruptcyAdvertSchema = z.infer<typeof bankruptcyAdvertSchema>
export type BankruptcyFormMetaSchema = z.infer<typeof bankruptcyFormMetaSchema>
export type BankruptcySettlementSchema = z.infer<
  typeof bankruptcySettlementSchema
>
export type LiquidatorSchema = z.infer<typeof liquidatorSchema>
export type BankruptcyDivisionMeetingsSchema = z.infer<
  typeof bankruptcyDivisionMeetingsSchema
>
export type BankruptcySignatureSchema = z.infer<
  typeof bankruptcySignatureSchema
>
export type BankruptcyPublishingSchema = z.infer<
  typeof bankruptcyPublishingSchema
>
export type BankruptcyFormSchema = z.infer<typeof bankruptcyFormSchema>

export enum BankruptcyFormFields {
  META_CASE_ID = 'meta.caseId',
  META_APPLICATION_ID = 'meta.applicationId',
  META_COURT_OPTIONS = 'meta.courtOptions',
  ADVERT_COURT_ID = 'advert.courtId',
  ADVERT_JUDGEMENT_DATE = 'advert.judgementDate',
  ADVERT_ADDITIONAL_TEXT = 'advert.additionalText',
  SETTLEMENT_NAME = 'settlement.name',
  SETTLEMENT_NATIONAL_ID = 'settlement.nationalId',
  SETTLEMENT_ADDRESS = 'settlement.address',
  SETTLEMENT_DEADLINE = 'settlement.deadline',
  LIQUIDATOR_NAME = 'liquidator.name',
  LIQUIDATOR_LOCATION = 'liquidator.location',
  LIQUIDATOR_ON_BEHALF_OF = 'liquidator.onBehalfOf',
  DIVISION_MEETING_DATE = 'divisionMeeting.date',
  DIVISION_MEETING_LOCATION = 'divisionMeeting.location',
  SIGNATURE_DATE = 'signature.date',
  SIGNATURE_LOCATION = 'signature.location',
  PUBLISHING_DATES = 'publishing',
}
