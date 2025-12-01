import z from 'zod'

import { communicationChannelSchema } from '../base/communication-channels'
import { signatureSchemaRefined } from '../base/signature'

export const createDivisionMeetingInput = z.object({
  meetingDate: z.iso.datetime({ error: 'Fundardagur er nauðsynlegur' }),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
  signature: signatureSchemaRefined,
  meetingLocation: z.string().refine((location) => location.length > 0, {
    message: 'Fundarstaður er nauðsynlegur',
  }),
})

export const createDivisionEndingInput = z.object({
  scheduledAt: z.iso.datetime({ error: 'Birtingardagur er nauðsynlegur' }),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
  signature: signatureSchemaRefined,
  declaredClaims: z.number().refine((num) => num >= 0, {
    message: 'Fylla þarf út fjölda yfirlýstra krafna',
  }),
})
