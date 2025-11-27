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
  name: z.string().optional(),
  location: z.string().optional(),
  date: z.iso.datetime().optional(),
  onBehalfOf: z.string().optional(),
})

export const baseApplicationSchema = z.object({
  additionalText: z.string().optional(),
  publishingDates: z.array(z.iso.datetime()).optional(),
  signature: signatureSchema.optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})

export const baseApplicationValidationSchema = z.object({
  additionalText: z.string().optional(),
  publishingDates: z
    .array(z.iso.datetime())
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
