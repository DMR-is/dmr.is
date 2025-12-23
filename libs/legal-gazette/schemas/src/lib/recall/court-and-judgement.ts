import { isDateString } from 'class-validator'
import z from 'zod'

import { baseEntitySchema } from '../base/base-entity'

export const courtAndJudgmentSchema = z.object({
  courtDistrict: baseEntitySchema.optional().nullable(),
  judgmentDate: z.string().optional().nullable(),
})

export const courtAndJudgmentSchemaRefined = z.object({
  courtDistrict: baseEntitySchema,
  judgmentDate: z.iso
    .datetime('Dagsetning úrskurðar er nauðsynleg')
    .refine((date) => isDateString(date), {
      message: 'Dagsetning úrskurðar er nauðsynleg',
    }),
})
