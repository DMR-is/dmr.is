import { isDateString } from 'class-validator'
import z from 'zod'

import {
  baseApplicationSchema,
  baseApplicationSchemaRefined,
} from '../base/application'
import { publishingDatesRecallSchemaRefined } from '../base/publishing-dates'
import { ApplicationTypeEnum } from '../constants'
import {
  courtAndJudgmentSchema,
  courtAndJudgmentSchemaRefined,
} from './court-and-judgement'
import {
  divisionMeetingSchema,
  divisionMeetingSchemaRefined,
} from './division-meeting'
import { settlementSchema, settlementSchemaRefined } from './settlement'

export const recallDeceasedSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema.extend({
    dateOfDeath: z.string().optional().nullable(),
  }),
})

export const recallDeceasedSchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: divisionMeetingSchemaRefined,
  settlementFields: settlementSchemaRefined.extend({
    dateOfDeath: z.iso.datetime().refine((date) => isDateString(date), {
      message: 'Frestdagur bús er nauðsynlegur',
    }),
  }),
})

export const recallDeceasedAnswersSchema = baseApplicationSchema.extend({
  fields: recallDeceasedSchema,
})

export const recallDeceasedAnswersSchemaRefined =
  baseApplicationSchemaRefined.extend({
    fields: recallDeceasedSchemaRefined,
  })

export const recallDeceasedApplicationSchema = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_DECEASED),
  answers: recallDeceasedAnswersSchema.optional(),
})

export const recallDeceasedApplicationSchemaRefined = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_DECEASED),
  answers: recallDeceasedAnswersSchemaRefined.extend({
    publishingDates: publishingDatesRecallSchemaRefined,
  }),
})

export const isRecallDeceasedApplicationSchema = (
  obj: unknown,
): obj is z.infer<typeof recallDeceasedApplicationSchema> => {
  const parseResult = recallDeceasedApplicationSchema.safeParse(obj)
  return parseResult.success
}

export const isRecallDeceasedApplicationSchemaRefined = (
  obj: unknown,
): obj is z.infer<typeof recallDeceasedApplicationSchemaRefined> => {
  const parseResult = recallDeceasedApplicationSchemaRefined.safeParse(obj)
  return parseResult.success
}
