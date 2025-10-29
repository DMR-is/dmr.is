import z from 'zod'

import { ApplicationInputFields } from './constants'

export const baseEntitySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
})

export const communicationChannelSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

export const signatureSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  date: z.iso.datetime().optional(),
  onBehalfOf: z.string().optional(),
})

export const publishingDatesSchema = z.object({
  publishingDate: z.iso.datetime(),
})

export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const applicationMetaDataSchema = z.object({
  caseId: z.string(),
  applicationId: z.string(),
  typeOptions: z.array(optionSchema),
  courtDistrictOptions: z.array(optionSchema),
})

export const baseFieldsSchema = z.object({
  additionalText: z.string().optional(),
})

export const baseApplicationSchema = z.object({
  metadata: applicationMetaDataSchema,
  signature: signatureSchema.refine(
    ({ name, date, location }) => {
      return name !== undefined || location !== undefined || date !== undefined
    },
    {
      path: [
        ApplicationInputFields.SIGNATURE_NAME,
        ApplicationInputFields.SIGNATURE_LOCATION,
        ApplicationInputFields.SIGNATURE_DATE,
      ],
      message:
        'Nafn, staður eða dagsetning undirritunar verður að vera til staðar',
    },
  ),
  publishingDates: z
    .array(publishingDatesSchema)
    .refine((dates) => dates.length < 1, {
      path: [ApplicationInputFields.PUBLISHING_DATES],
      message:
        'Að minnsta kosti ein birtingardagsetning verður að vera til staðar',
    })
    .refine((dates) => dates.length > 3, {
      path: [ApplicationInputFields.PUBLISHING_DATES],
      message: 'Hámark þrjár birtingardagsetningar eru leyfðar',
    }),
  communicationChannels: z
    .array(communicationChannelSchema)
    .refine((channels) => channels.length < 1, {
      path: [ApplicationInputFields.COMMUNICATION_CHANNELS],
      message: 'Að minnsta kosti einn samskiptaleið verður að vera til staðar',
    }),
})
