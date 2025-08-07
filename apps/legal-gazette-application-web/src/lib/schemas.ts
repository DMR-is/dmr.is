import { z } from 'zod'

export const bankruptcyApplicationMetaSchema = z.object({
  caseId: z.string('Case ID is required'),
  applicationId: z.string('Application ID is required'),
  courtOptions: z.array(
    z.object({
      label: z.string('Court label is required'),
      value: z.string('Court value is required'),
    }),
  ),
})

export const bankruptcyAdvertSchema = z.object({
  courtId: z.uuid('Staður er nauðsynlegur'),
  judgementDate: z.date('Úrskurðar dagsetning er nauðsynleg'),
  additionalText: z.string().optional(),
})

export const bankruptcySettlementSchema = z.object({
  name: z.string('Nafn bús er nauðsynlegt'),
  nationalId: z.string('Kennitala bús er nauðsynleg'),
  address: z.string('Heimilisfang bús er nauðsynlegt'),
  deadline: z.date('Frestdagur bús er nauðsynlegur'),
})

export const liquidatorSchema = z.object({
  name: z.string('Nafn skiptastjóra er nauðsynlegt'),
  location: z.string('Staðsetning skiptastjóra er nauðsynleg'),
  onBehalfOf: z.string().optional(),
})

export const bankruptcyDivisionMeetingsSchema = z.object({
  date: z.date('Dagsetning skiptafundar er nauðsynleg'),
  location: z.string('Staðsetning skiptafundar er nauðsynleg'),
})

export const bankruptcySignatureSchema = z.object({
  date: z.date('Dagsetning undirritunar er nauðsynleg'),
  location: z.string('Staðsetning undirritunar er nauðsynleg'),
})

export const bankruptcyPublishingSchema = z
  .array(z.date('Dagsetning fyrir birtingu er nauðsynleg'))
  .refine(
    (dates) => dates.length > 0,
    'Að minnsta kosti ein dagsetning fyrir birtingu er nauðsynleg',
  )

export const bankruptcyApplicationSchema = z.object({
  meta: bankruptcyApplicationMetaSchema,
  advert: bankruptcyAdvertSchema,
  settlement: bankruptcySettlementSchema,
  liquidator: liquidatorSchema,
  divisionMeeting: bankruptcyDivisionMeetingsSchema,
  signature: bankruptcySignatureSchema,
  publishing: bankruptcyPublishingSchema,
})

export type BankruptcyAdvertSchema = z.infer<typeof bankruptcyAdvertSchema>
export type BankruptcyApplicationMetaSchema = z.infer<
  typeof bankruptcyApplicationMetaSchema
>
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
export type BankruptcyApplicationSchema = z.infer<
  typeof bankruptcyApplicationSchema
>

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
