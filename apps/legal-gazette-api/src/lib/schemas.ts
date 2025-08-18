import { z } from 'zod'

import { RecallTypeEnum } from './constants'

export const settlementSchema = z
  .object({
    liquidatorName: z.string(),
    liquidatorLocation: z.string(),
    liquidatorOnBehalfOf: z.string().optional(),
    settlementName: z.string(),
    settlementNationalId: z.string(),
    settlementAddress: z.string(),
    settlementDeadline: z.date().nullable().optional(),
    settlementDateOfDeath: z.date().nullable().optional(),
  })
  .refine((settlement) => {
    // deadline or date of death must be provided
    if (!settlement.settlementDeadline && !settlement.settlementDateOfDeath) {
      return false
    }

    return true
  })

export const recallApplicationSchema = z.object({
  recallType: z.enum(RecallTypeEnum),
  additionalText: z.string().optional().nullable(),
  judgmentDate: z.date(),
  signatureLocation: z.string(),
  signatureDate: z.date(),
  courtDistrictId: z.string(),
  liquidatorName: z.string(),
  liquidatorLocation: z.string(),
  liquidatorOnBehalfOf: z.string().optional(),
  settlementId: z.string(),
  meetingDate: z.date(),
  meetingLocation: z.string(),
  publishingDates: z.array(z.date()).refine((dates) => dates.length > 0),
})

const bankruptcySchema = z.object({
  settlementDeadline: z.date(),
})

const deceasedSchema = z.object({
  settlementDateOfDeath: z.date(),
})

export const bankruptcyRecallApplicationSchema = recallApplicationSchema.extend(
  bankruptcySchema.shape,
)

export const deceasedRecallApplicationSchema = recallApplicationSchema.extend(
  deceasedSchema.shape,
)

export type RecallApplication = z.infer<typeof recallApplicationSchema>
export type BankruptcyRecallApplication = z.infer<
  typeof bankruptcyRecallApplicationSchema
>
export type DeceasedRecallApplication = z.infer<
  typeof deceasedRecallApplicationSchema
>

export const commonFormSchema = z.object({
  categoryId: z.string(),
  caption: z.string(),
  html: z.string(),
  signatureDate: z.date(),
  signatureLocation: z.string(),
  signatureName: z.string(),
  publishingDates: z.array(z.date()).refine((dates) => dates.length > 0),
})
