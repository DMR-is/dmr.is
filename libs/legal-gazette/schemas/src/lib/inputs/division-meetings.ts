import * as z from 'zod'

import { communicationChannelSchema } from '../base/communication-channels'
import { signatureSchemaRefined } from '../base/signature'

export const createDivisionMeetingInput = z.object({
  meetingDate: z.iso.datetime({
    error: 'Dagsetning skiptafundar er nauðsynleg',
  }),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema),
  signature: signatureSchemaRefined,
  meetingLocation: z.string().refine((location) => location.length > 0, {
    message: 'Staðsetning skiptafundar er nauðsynleg',
  }),
})

export const createDivisionEndingInput = createDivisionMeetingInput.extend({
  declaredClaims: z.number().min(0, {
    message: 'Lýstar kröfur þurfa vera 0 eða hærri',
  }),
  meetingLocation: z.string().optional(),
})

export const createDivisionMeetingWithIdInput =
  createDivisionMeetingInput.extend({
    applicationId: z.uuid(),
  })

export const createDivisionEndingWithIdInput = createDivisionEndingInput.extend(
  {
    applicationId: z.uuid(),
  },
)
