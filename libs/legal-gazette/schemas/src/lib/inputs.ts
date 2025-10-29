import z from 'zod'

import {
  communicationChannelSchema,
  publishingDatesSchema,
  signatureSchema,
} from './base'
import { commonApplicationFieldsScehma } from './common'

export const updateApplicationSchema = z.object({
  additionalText: z.string().optional(),
  commonFields: commonApplicationFieldsScehma.partial().optional(),
  signature: signatureSchema.optional(),
  publishingDates: z.array(publishingDatesSchema).optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})
