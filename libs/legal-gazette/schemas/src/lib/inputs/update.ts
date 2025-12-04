import z from 'zod'

import { commonApplicationSchema } from '../common'
import {
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
} from '../recall'

export const updateApplicationInput = z.discriminatedUnion('type', [
  commonApplicationSchema,
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
])

export const updateApplicationWithIdInput = z
  .object({
    id: z.uuid(),
  })
  .and(updateApplicationInput)
