import { isString } from 'class-validator'
import z from 'zod'

import {
  baseApplicationSchema,
  baseApplicationSchemaRefined,
} from '../base/application'
import { baseEntitySchema } from '../base/base-entity'
import { metadataSchema } from '../base/metadata'
import { ApplicationTypeEnum } from '../constants'

export const commonFieldsSchema = z.object({
  type: baseEntitySchema.optional().nullable(),
  category: baseEntitySchema.optional().nullable(),
  caption: z.string().optional().nullable(),
  html: z.string().optional().nullable(),
})

export const commonFieldsSchemaRefined = z.object({
  type: baseEntitySchema,
  category: baseEntitySchema,
  caption: z
    .string('Yfirskrift er nauðsynleg')
    .refine((caption) => isString(caption) && caption.length > 0, {
      message: 'Yfirskrift er nauðsynleg',
    }),
  html: z
    .string('Efni auglýsingar er nauðsynlegt')
    .refine((html) => isString(html) && html.length > 0, {
      message: 'Efni auglýsingar er nauðsynlegt',
    }),
})

export const commonApplicationAnswers = baseApplicationSchema.extend({
  fields: commonFieldsSchema.optional(),
})

export const commonApplicationAnswersRefined =
  baseApplicationSchemaRefined.extend({
    fields: commonFieldsSchemaRefined,
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

export const commonApplicationWebSchema = commonApplicationAnswers.extend({
  metadata: metadataSchema.extend({
    typeOptions: z.array(
      z.object({
        label: z.string(),
        value: baseEntitySchema,
      }),
    ),
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
