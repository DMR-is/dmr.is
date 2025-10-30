import { isUUID } from 'class-validator'
import z from 'zod'

import { baseApplicationSchema, baseFieldsSchema } from './base'

export const commonApplicationFieldsScehma = baseFieldsSchema.extend({
  typeId: z.uuid().refine((id) => isUUID(id), {
    message: 'Tegund auglýsingar er nauðsynleg',
  }),
  categoryId: z.uuid().refine((id) => isUUID(id), {
    message: 'Flokkur auglýsingar er nauðsynlegur',
  }),
  caption: z.string().refine((caption) => caption.length > 0, {
    message: 'Yfirskrift er nauðsynleg',
  }),
  html: z.string().refine((html) => html.length > 0, {
    message: 'Efni auglýsingar er nauðsynlegt',
  }),
})

export const commonApplicationSchema = baseApplicationSchema.extend({
  fields: commonApplicationFieldsScehma,
})

export const commonApplicationValidationSchema = commonApplicationSchema.omit({
  metadata: true,
})
