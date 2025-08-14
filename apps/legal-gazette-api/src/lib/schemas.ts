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
    settlementDeadline: z
      .string()
      .transform((iso) => new Date(iso))
      .nullable()
      .optional(),
    settlementDateOfDeath: z
      .string()
      .transform((iso) => new Date(iso))
      .nullable()
      .optional(),
  })
  .refine((settlement) => {
    // deadline or date of death must be provided
    if (!settlement.settlementDeadline && !settlement.settlementDateOfDeath) {
      return false
    }

    return true
  })

export const recallApplicationSchema = z.object({
  applicationType: z.enum(RecallTypeEnum),
  additionalText: z.string().optional().nullable(),
  judgmentDate: z.iso.datetime().transform((date) => new Date(date)),
  signatureLocation: z.string(),
  signatureDate: z.iso.datetime().transform((date) => new Date(date)),
  courtDistrictId: z.string(),
  liquidatorName: z.string(),
  liquidatorLocation: z.string(),
  liquidatorOnBehalfOf: z.string().optional(),
  settlementId: z.string(),
  meetingDate: z.iso.datetime().transform((date) => new Date(date)),
  meetingLocation: z.string(),
  publishingDates: z
    .array(z.iso.datetime().transform((date) => new Date(date)))
    .refine((dates) => dates.length > 0),
})

const bankruptcySchema = z.object({
  settlementDeadline: z.iso.datetime().transform((date) => new Date(date)),
})

const deceasedSchema = z.object({
  settlementDateOfDeath: z.iso.datetime().transform((date) => new Date(date)),
})

export const bankruptcyRecallApplicationSchema = recallApplicationSchema.extend(
  bankruptcySchema.shape,
)

export const deceasedRecallApplicationSchema = recallApplicationSchema.extend(
  deceasedSchema.shape,
)
