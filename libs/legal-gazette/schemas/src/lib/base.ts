import z from 'zod'

import {
  applicationMetaDataSchema,
  communicationChannelSchema,
  publishingDatesSchema,
  signatureSchema,
} from './shared'

export const baseApplicationSchema = z.object({
  metadata: applicationMetaDataSchema,
  signature: signatureSchema,
  publishingDates: z.array(publishingDatesSchema),
  communicationChannels: z.array(communicationChannelSchema),
})
