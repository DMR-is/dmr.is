import { isString } from 'class-validator'
import z from 'zod'

import { communicationChannelSchema, signatureSchema } from './base'

const divisionSignatureSchema = signatureSchema.superRefine(
  (schema, context) => {
    const check = (val?: string) => isString(val) && val.length > 0

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
  },
)

export const addDivisionMeetingValidationSchema = z.object({
  meetingDate: z.iso.datetime({ error: 'Fundardagur er nauðsynlegur' }),
  meetingLocation: z.string().refine((location) => location.length > 0, {
    message: 'Fundarstaður er nauðsynlegur',
  }),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
  signature: divisionSignatureSchema,
})

export const addDivisionEndingValidationSchema = z.object({
  scheduledAt: z.iso.datetime({ error: 'Birtingardagur er nauðsynlegur' }),
  declaredClaims: z.number().refine((num) => num >= 0, {
    message: 'Fylla þarf út fjölda yfirlýstra krafna',
  }),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
  signature: divisionSignatureSchema,
})
