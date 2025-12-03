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

export const recallDeceasedAnswers = baseApplicationSchema.extend({
  fields: recallDeceasedSchema.optional(),
})

export const recallDeceasedAnswersRefined = baseApplicationSchemaRefined.extend(
  {
    fields: recallDeceasedSchemaRefined,
  },
)

export const recallDeceasedApplicationSchema = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_DECEASED),
  answers: recallDeceasedAnswers.optional(),
})

export const recallDeceasedApplicationSchemaRefined = z.object({
  ...recallDeceasedAnswersRefined.extend({
    publishingDates: publishingDatesRecallSchemaRefined,
  }),
  type: z.literal(ApplicationTypeEnum.RECALL_DECEASED),
})
