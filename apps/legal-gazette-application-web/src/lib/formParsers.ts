import { z } from 'zod'

import {
  CreateBankruptcyAdvertAttributesDto,
  CreateBankruptcyAdvertDto,
  CreateBankruptcyAdvertRequest,
} from '../gen/fetch'

export const throtabuSchema = z.object({
  bankruptcyAdvert: z.object({
    claimsSentTo: z.string(),
    courtDistrictId: z.string(),
    judgmentDate: z.string(),
    location: z.string(),
    signatureDate: z.string(),
    signatureLocation: z.string(),
    signatureName: z.string(),
    additionalText: z.string(),
    signatureOnBehalfOf: z.string(),
  }),
  caseId: z.string(),
  scheduledAt: z.string(),
})

export const parseThrotabuForm = (
  form: FormData,
): CreateBankruptcyAdvertRequest => {
  return {} as CreateBankruptcyAdvertRequest
}
