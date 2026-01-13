import { isDateString } from 'class-validator'
import * as z from 'zod'

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

export const recallBankruptcySchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      deadlineDate: z.string().optional().nullable(),
    })
    .optional(),
})

export const recallBankruptcySchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: divisionMeetingSchemaRefined,
  settlementFields: settlementSchemaRefined.extend({
    deadlineDate: z.iso
      .datetime('Frestdagur bús er nauðsynlegur')
      .refine((date) => isDateString(date), {
        message: 'Frestdagur bús er nauðsynlegur',
      }),
  }),
})

export const recallBankruptcyAnswers = baseApplicationSchema.extend({
  fields: recallBankruptcySchema.optional(),
})

export const recallBankruptcyAnswersRefined =
  baseApplicationSchemaRefined.extend({
    fields: recallBankruptcySchemaRefined,
    publishingDates: publishingDatesRecallSchemaRefined,
  })

export const recallBankruptcyApplicationSchema = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_BANKRUPTCY),
  answers: recallBankruptcyAnswers.partial().optional(),
})

export const recallBankruptcyApplicationSchemaRefined = z.object({
  ...recallBankruptcyAnswersRefined,
  type: z.literal(ApplicationTypeEnum.RECALL_BANKRUPTCY),
})
