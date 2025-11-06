import { isString } from 'class-validator'
import z from 'zod'

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
  name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  date: z.iso.datetime().optional().nullable(),
  onBehalfOf: z.string().optional().nullable(),
})

export const strictSignatureSchema = z.object({
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

export const baseApplicationSchema = z.object({
  metadata: applicationMetaDataSchema.refine(() => true),
  additionalText: z.string().optional(),
  publishingDates: z
    .array(publishingDatesSchema)
    .min(1, {
      message: 'Að minnsta kosti einn birtingardagur verður að vera til staðar',
    })
    .max(3, {
      message: 'Hámark þrír birtingardagar mega vera til staðar',
    }),
  signature: signatureSchema.superRefine((schema, context) => {
    const check = (val: any) => isString(val) && val.length > 0

    const isAnySet =
      check(schema.name) || check(schema.location) || check(schema.date)

    if (!isAnySet) {
      context.addIssue({
        code: 'custom',
        message:
          'Nafn, staðsetning eða dagsetning undirritunar verður að vera til staðar',
        path: [],
      })
    }
  }),
  communicationChannels: z.array(communicationChannelSchema).min(1, {
    message: 'Að minnsta kosti ein samskiptaleið verður að vera til staðar',
  }),
})
