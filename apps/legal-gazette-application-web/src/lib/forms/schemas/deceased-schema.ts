import { z } from 'zod'

export const deceasedFormMetaSchema = z.object({
  caseId: z.string(),
  applicationId: z.string(),
})

export const deceasedFormSchema = z.object({
  meta: deceasedFormMetaSchema,
})

export type DeceasedFormSchema = z.infer<typeof deceasedFormSchema>
