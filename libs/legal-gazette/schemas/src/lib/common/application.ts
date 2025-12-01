import { isString, isUUID } from 'class-validator'
import z from 'zod'

import {
  baseApplicationSchema,
  baseApplicationSchemaRefined,
} from '../base/application'
import { ApplicationTypeEnum } from '../constants'

export const commonFieldsSchema = z.object({
  typeId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  html: z.string().optional().nullable(),
})

export const commonApplicationAnswers = baseApplicationSchema.extend({
  fields: commonFieldsSchema.optional(),
})

export const commonFieldsSchemaRefined = z.object({
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
  type: z.literal(ApplicationTypeEnum.COMMON),
  answers: commonApplicationAnswers.optional(),
})

export const commonApplicationSchemaRefined = z.object({
  type: ApplicationTypeEnum.COMMON,
  answers: baseApplicationSchemaRefined.extend({
    fields: commonFieldsSchemaRefined,
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
