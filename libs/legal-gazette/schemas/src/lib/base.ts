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

export const baseFields = z.object({
  additionalText: z.string().optional(),
})

export const commonApplicationFields = baseFields.extend({
  typeId: z.string(),
  categoryId: z.string(),
  caption: z.string(),
  html: z.string(),
})

export const commonApplicationSchema = baseApplicationSchema.extend({
  fields: commonApplicationFields,
})

export const updateApplicationSchema = z.object({
  additionalText: z.string().optional(),
  commonFields: commonApplicationFields.partial().optional(),
  signature: signatureSchema.optional(),
  publishingDates: z.array(publishingDatesSchema).optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})
