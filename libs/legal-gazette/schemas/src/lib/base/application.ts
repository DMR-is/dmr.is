import z from 'zod'

import {
  communicationChannelSchema,
  communicationChannelSchemaRefined,
} from './communication-channels'
import {
  publishingDatesSchema,
  publishingDatesSchemaRefined,
} from './publishing-dates'
import { signatureSchema, signatureSchemaRefined } from './signature'

export const baseApplicationSchema = z.object({
  additionalText: z.string().optional(),
  publishingDates: publishingDatesSchema.optional(),
  signature: signatureSchema.optional(),
  communicationChannels: communicationChannelSchema.optional(),
})

export const baseApplicationSchemaRefined = z.object({
  additionalText: z.string().optional(),
  publishingDates: publishingDatesSchemaRefined,
  signature: signatureSchemaRefined,
  communicationChannels: communicationChannelSchemaRefined,
})
