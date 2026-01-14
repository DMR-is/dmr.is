import * as z from 'zod'

import { ApplicationTypeEnum } from '../constants'

export const metadataSchema = z.object({
  applicationId: z.string(),
  caseId: z.string(),
  type: z.enum(ApplicationTypeEnum),
  totalSteps: z.number(),
  currentStep: z.number(),
  canProceed: z.boolean().optional(),
  isBankruptcy: z.boolean(),
})
