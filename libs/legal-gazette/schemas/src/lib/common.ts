import { isUUID } from 'class-validator'
import z from 'zod'

import { baseApplicationSchema, baseFieldsSchema } from './base'
import { CommonApplicationInputFields } from './constants'

export const commonApplicationFieldsScehma = baseFieldsSchema.extend({
  typeId: z.uuid().refine((id) => isUUID(id), {
    path: [CommonApplicationInputFields.TYPE],
    message: 'Tegund auglýsingar er nauðsynleg',
  }),
  categoryId: z.uuid().refine((id) => isUUID(id), {
    path: [CommonApplicationInputFields.CATEGORY],
    message: 'Flokkur auglýsingar er nauðsynlegur',
  }),
  caption: z.string().refine((caption) => caption.length > 0, {
    path: [CommonApplicationInputFields.CAPTION],
    message: 'Yfirskrift er nauðsynleg',
  }),
  html: z.string().refine((html) => html.length > 0, {
    path: [CommonApplicationInputFields.HTML],
    message: 'Efni auglýsingar er nauðsynlegt',
  }),
})

export const commonApplicationSchema = baseApplicationSchema.extend({
  fields: commonApplicationFieldsScehma,
})
