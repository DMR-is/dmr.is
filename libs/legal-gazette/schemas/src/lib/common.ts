import z from 'zod'

import { baseApplicationSchema, baseFieldsSchema } from './base'

export const commonApplicationFieldsScehma = baseFieldsSchema.extend({
  typeId: z.string(),
  categoryId: z.string(),
  caption: z.string(),
  html: z.string(),
})

export const commonApplicationSchema = baseApplicationSchema.extend({
  fields: commonApplicationFieldsScehma,
})
