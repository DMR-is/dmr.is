import { z } from 'zod'

export const commonFormMetaSchema = z.object({
  caseId: z.string(),
  applicationId: z.string(),
})

export const commonFormSchema = z.object({
  meta: commonFormMetaSchema,
})

export type CommonFormMetaSchema = z.infer<typeof commonFormMetaSchema>

export type CommonFormSchema = z.infer<typeof commonFormSchema>
