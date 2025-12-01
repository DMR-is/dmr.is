import { isDateString, isUUID } from 'class-validator'
import z from 'zod'

export const courtAndJudgmentSchema = z.object({
  courtDistrictId: z.string().optional().nullable(),
  judgmentDate: z.string().optional().nullable(),
})

export const courtAndJudgmentSchemaRefined = z.object({
  courtDistrictId: z.string().refine((id) => isUUID(id), {
    message: 'Dómstóll er nauðsynlegur',
  }),
  judgmentDate: z.iso.datetime().refine((date) => isDateString(date), {
    message: 'Úrskurðar dagsetning er nauðsynlegur',
  }),
})
