import * as z from 'zod'

import {
  DIVISION_MEETING_NOTICE_MESSAGE,
  isDivisionMeetingNoticeSufficient,
  isOnOrAfterEarliestPublishingDay,
  PUBLISHING_DATE_CUTOFF_MESSAGE,
} from '../base/publishing-dates'
import { signatureSchemaRefined } from '../base/signature'

/**
 * The fields of a skiptafundur, without the cross-field notice rule. Forms use
 * it for their partial state; validate with {@link createDivisionMeetingInput}.
 */
export const createDivisionMeetingFields = z.object({
  meetingDate: z.iso.datetime({
    error: 'Dagsetning skiptafundar er nauðsynleg',
  }),
  scheduledAt: z.coerce
    .date({
      error: 'Dagsetning birtingar er nauðsynleg',
    })
    .refine((date) => isOnOrAfterEarliestPublishingDay(date), {
      message: PUBLISHING_DATE_CUTOFF_MESSAGE,
    }),
  content: z.string().optional(),
  additionalText: z.string().optional(),
  signature: signatureSchemaRefined,
  meetingLocation: z.string().refine((location) => location.length > 0, {
    message: 'Staðsetning skiptafundar er nauðsynleg',
  }),
})

const refineDivisionMeetingNotice = (
  value: { meetingDate: string; scheduledAt: Date },
  ctx: z.RefinementCtx,
) => {
  if (
    !isDivisionMeetingNoticeSufficient(value.scheduledAt, value.meetingDate)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['scheduledAt'],
      message: DIVISION_MEETING_NOTICE_MESSAGE,
    })
  }
}

export const createDivisionMeetingInput =
  createDivisionMeetingFields.superRefine(refineDivisionMeetingNotice)

export const createDivisionEndingInput = z.object({
  declaredClaims: z.number().optional(),
  endingDate: z.coerce.date({
    error: 'Dagsetning skiptaloka er nauðsynleg',
  }),
  scheduledAt: z.coerce
    .date({
      error: 'Dagsetning birtingar er nauðsynleg',
    })
    .refine((date) => isOnOrAfterEarliestPublishingDay(date), {
      message: PUBLISHING_DATE_CUTOFF_MESSAGE,
    }),
  content: z
    .string('Nauðsynlegt er að fylla út hvernig skiptum var lokið')
    .refine((content) => content.length > 0, {
      message: 'Nauðsynlegt er að fylla út hvernig skiptum var lokið',
    }),
  additionalText: z.string().optional(),
  signature: signatureSchemaRefined,
})

export const createDivisionMeetingWithIdInput = createDivisionMeetingFields
  .extend({
    applicationId: z.uuid(),
  })
  .superRefine(refineDivisionMeetingNotice)

export const createDivisionEndingWithIdInput = createDivisionEndingInput.extend(
  {
    applicationId: z.uuid(),
  },
)
