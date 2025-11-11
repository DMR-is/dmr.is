import { isString } from 'class-validator'
import z from 'zod'

import { communicationChannelSchema, signatureSchema } from './base'

export const addDivisionMeetingValidationSchema = z.object({
  meetingDate: z.iso.datetime({ error: 'Fundardagur er nauðsynlegur' }),
  meetingLocation: z.string().refine((location) => location.length > 0, {
    message: 'Fundarstaður er nauðsynlegur',
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
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})
