import z from 'zod'

import { baseApplicationSchema } from './base'

export const commonApplicationFields = z.object({
  type: z.string(),
  category: z.string(),
  caption: z.string(),
  html: z.string(),
})

export const commonApplicationSchema = baseApplicationSchema.extend({
  fields: commonApplicationFields,
})
