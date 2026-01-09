import z from 'zod'

import { commonApplicationAnswersRefined } from '@dmr.is/legal-gazette/schemas'

export const createUserInput = z.object({
  email: z.email(),
  nationalId: z.string().min(10).max(10),
  phone: z.string().optional(),
})

export const updateUserInput = z
  .object({
    userId: z.string(),
    email: z.email().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'At least one of email or phone must be provided',
  })

export const createAdvertAndCommonApplicationInput =
  commonApplicationAnswersRefined.extend({
    applicantNationalId: z.string().min(10).max(10),
  })
