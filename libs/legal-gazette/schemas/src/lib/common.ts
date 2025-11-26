import { isString, isUUID } from 'class-validator'
import z from 'zod'

import { baseApplicationSchema } from './base'
import { ApplicationTypeEnum } from './constants'

export const commonApplicationFieldsSchema = z.object({
  typeId: z
    .string()
    .optional()
    .refine((id) => id && isUUID(id), {
      message: 'Tegund auglýsingar er nauðsynleg',
    }),
  categoryId: z
    .string()
    .optional()
    .refine((id) => id && isUUID(id), {
      message: 'Flokkur auglýsingar er nauðsynlegur',
    }),
  caption: z
    .string()
    .optional()
    .refine((caption) => isString(caption) && caption.length > 0, {
      message: 'Yfirskrift er nauðsynleg',
    }),
  html: z
    .string()
    .optional()
    .refine((html) => isString(html) && html.length > 0, {
      message: 'Efni auglýsingar er nauðsynlegt',
    }),
})

export const commonApplicationValidationFieldsSchema = z.object({
  typeId: z.uuid().refine((id) => isUUID(id), {
    message: 'Tegund auglýsingar er nauðsynleg',
  }),
  categoryId: z.uuid().refine((id) => isUUID(id), {
    message: 'Flokkur auglýsingar er nauðsynlegur',
  }),
  caption: z
    .string()
    .refine((caption) => isString(caption) && caption.length > 0, {
      message: 'Yfirskrift er nauðsynleg',
    }),
  html: z.string().refine((html) => isString(html) && html.length > 0, {
    message: 'Efni auglýsingar er nauðsynlegt',
  }),
})

export const commonApplicationSchema = baseApplicationSchema.extend({
  type: ApplicationTypeEnum.COMMON,
  answers: commonApplicationFieldsSchema,
})

export const commonApplicationValidationSchema = baseApplicationSchema.extend({
  type: ApplicationTypeEnum.COMMON,
  answers: commonApplicationValidationFieldsSchema,
})
