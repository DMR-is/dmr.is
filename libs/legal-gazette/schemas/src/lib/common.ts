import { isString, isUUID } from 'class-validator'
import z from 'zod'

import { baseApplicationSchema, baseApplicationValidationSchema } from './base'
import { ApplicationTypeEnum } from './constants'

export const commonFieldsSchema = z.object({
  typeId: z.string().optional(),
  categoryId: z.string().optional(),
  caption: z.string().optional(),
  html: z.string().optional(),
})

export const commonFieldsValidationSchema = z.object({
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

export const commonApplicationSchema = z.object({
  type: ApplicationTypeEnum.COMMON,
  answers: baseApplicationSchema
    .extend({
      fields: commonFieldsSchema,
    })
    .optional(),
})

export const commonApplicationValidationSchema = z.object({
  type: ApplicationTypeEnum.COMMON,
  answers: baseApplicationValidationSchema.extend({
    fields: commonFieldsValidationSchema,
  }),
})

export const isCommonApplication = (
  application: z.infer<typeof commonApplicationSchema>,
): application is z.infer<typeof commonApplicationSchema> & {
  type: ApplicationTypeEnum.COMMON
  answers: z.infer<typeof commonApplicationSchema>['answers'] & {
    fields: z.infer<typeof commonFieldsSchema>
  }
} => {
  return application.type === ApplicationTypeEnum.COMMON
}
