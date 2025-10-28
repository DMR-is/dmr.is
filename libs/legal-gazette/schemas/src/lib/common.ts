import z from 'zod'

import {
  applicationMetaDataSchema,
  communicationChannelSchema,
  publishingDatesSchema,
  signatureSchema,
} from './shared'

export const commonApplicationFields = z.object({
  type: z.string(),
  category: z.string(),
  caption: z.string(),
  html: z.string(),
})

export const commonApplicationSchema = z.object({
  metadata: applicationMetaDataSchema,
  fields: commonApplicationFields,
  signature: signatureSchema,
  publishingDates: z.array(publishingDatesSchema),
  communicationChannels: z.array(communicationChannelSchema),
})
