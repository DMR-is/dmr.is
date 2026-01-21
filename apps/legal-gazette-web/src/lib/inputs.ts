import Kennitala from 'kennitala'
import * as z from 'zod'

import {
  commonApplicationAnswersRefined,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
} from '@dmr.is/legal-gazette/schemas'

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

const applicantNationalId = z.object({
  applicantNationalId: z.string().refine((val) => Kennitala.isValid(val), {
    message: 'Kennitala er ekki gild',
  }),
})

export const createAdvertAndCommonApplicationInput =
  commonApplicationAnswersRefined.extend(applicantNationalId.shape)

export const createAdvertAndRecallBankruptcyApplicationInput =
  recallBankruptcyAnswersRefined.extend(applicantNationalId.shape)

export const createAdvertAndDeceasedApplicationInput =
  recallDeceasedAnswersRefined.extend(applicantNationalId.shape)
