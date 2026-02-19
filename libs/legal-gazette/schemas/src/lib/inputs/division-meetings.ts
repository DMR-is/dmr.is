import * as z from 'zod'

import { signatureSchemaRefined } from '../base/signature'

export const createDivisionMeetingInput = z.object({
  meetingDate: z.iso.datetime({
    error: 'Dagsetning skiptafundar er nauðsynleg',
  }),
  content: z.string().optional(),
  additionalText: z.string().optional(),
  signature: signatureSchemaRefined,
  meetingLocation: z.string().refine((location) => location.length > 0, {
    message: 'Staðsetning skiptafundar er nauðsynleg',
  }),
})

export const createDivisionEndingInput = z.object({
  declaredClaims: z.number().optional(),
  endingDate: z.date('Dagsetning lokaskráningar er nauðsynleg'),
  scheduledAt: z.date('Dagsetning birtingar er nauðsynleg'),
  content: z.string().optional(),
  additionalText: z.string().optional(),
  signature: signatureSchemaRefined,
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
