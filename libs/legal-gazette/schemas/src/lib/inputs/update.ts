import * as z from 'zod'

import { commonApplicationSchema } from '../common'
import {
  recallBankruptcyApplicationSchema,
  recallBankruptcyApplicationSchemaLegacy,
  recallDeceasedApplicationSchema,
  recallDeceasedApplicationSchemaLegacy,
} from '../recall'

// Modern schema (prefer this for new applications)
export const updateApplicationInput = z
  .discriminatedUnion('type', [
    commonApplicationSchema,
    recallBankruptcyApplicationSchema,
    recallDeceasedApplicationSchema,
  ])
  .and(z.object({ currentStep: z.number().optional() }))

// Legacy schema (for existing applications with old date fields)
export const updateApplicationInputLegacy = z
  .discriminatedUnion('type', [
    commonApplicationSchema,
    recallBankruptcyApplicationSchemaLegacy,
    recallDeceasedApplicationSchemaLegacy,
  ])
  .and(z.object({ currentStep: z.number().optional() }))

// Combined schema (accepts both modern and legacy formats)
export const updateApplicationInputCombined = z.union([
  updateApplicationInput,
  updateApplicationInputLegacy,
])

export const updateApplicationWithIdInput = z
  .object({
    id: z.uuid(),
  })
  .and(updateApplicationInputCombined)
