import * as z from 'zod'

import { metadataSchema } from '../base/metadata'
import {
  recallBankruptcyApplicationSchema,
  recallBankruptcyApplicationSchemaRefined,
} from './bankruptcy'
import {
  recallDeceasedApplicationSchema,
  recallDeceasedApplicationSchemaRefined,
} from './deceased'

export const recallApplicationSchema = z.discriminatedUnion('type', [
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
])

export const recallApplicationSchemaRefined = z.discriminatedUnion('type', [
  recallBankruptcyApplicationSchemaRefined,
  recallDeceasedApplicationSchemaRefined,
])

export const recallApplicationAnswers = z.union([
  recallBankruptcyApplicationSchema.shape.answers,
  recallDeceasedApplicationSchema.shape.answers,
])

export const recallApplicationWebSchema = z
  .object({
    metadata: metadataSchema.extend({
      courtOptions: z.array(z.object({ label: z.string(), value: z.string() })),
    }),
  })
  .and(recallApplicationAnswers)

export const isRecallApplicationSchema = (
  obj: unknown,
): obj is z.infer<typeof recallApplicationSchema> => {
  const parseResult = recallApplicationSchema.safeParse(obj)
  return parseResult.success
}

export const isRecallApplicationSchemaRefined = (
  obj: unknown,
): obj is z.infer<typeof recallApplicationSchemaRefined> => {
  const parseResult = recallApplicationSchemaRefined.safeParse(obj)
  return parseResult.success
}
