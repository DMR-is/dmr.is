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

// Modern schema with single date field
export const recallBankruptcySchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      date: z.string().optional().nullable(),
    })
    .optional(),
})

// Legacy schema for backward compatibility (existing applications)
export const recallBankruptcySchemaLegacy = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      deadlineDate: z.string().optional().nullable(),
    })
    .optional(),
})

// Modern refined schema
export const recallBankruptcySchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: divisionMeetingSchemaRefined,
  settlementFields: settlementSchemaRefined.extend({
    date: z.iso
      .datetime('Dagsetning bús er nauðsynleg')
      .refine((date) => isDateString(date), {
        message: 'Dagsetning bús er nauðsynleg',
      }),
  }),
})

// Legacy refined schema for backward compatibility
export const recallBankruptcySchemaRefinedLegacy = z.object({
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

// Modern answers schema
export const recallBankruptcyAnswers = baseApplicationSchema.extend({
  fields: recallBankruptcySchema.optional(),
})

// Legacy answers schema
export const recallBankruptcyAnswersLegacy = baseApplicationSchema.extend({
  fields: recallBankruptcySchemaLegacy.optional(),
})

// Modern refined answers
export const recallBankruptcyAnswersRefined =
  baseApplicationSchemaRefined.extend({
    fields: recallBankruptcySchemaRefined,
    publishingDates: publishingDatesRecallSchemaRefined,
  })

// Legacy refined answers
export const recallBankruptcyAnswersRefinedLegacy =
  baseApplicationSchemaRefined.extend({
    fields: recallBankruptcySchemaRefinedLegacy,
    publishingDates: publishingDatesRecallSchemaRefined,
  })

// Modern application schema
export const recallBankruptcyApplicationSchema = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_BANKRUPTCY),
  answers: recallBankruptcyAnswers.partial().optional(),
})

// Legacy application schema
export const recallBankruptcyApplicationSchemaLegacy = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_BANKRUPTCY),
  answers: recallBankruptcyAnswersLegacy.partial().optional(),
})

// Modern refined application schema
export const recallBankruptcyApplicationSchemaRefined = z.object({
  ...recallBankruptcyAnswersRefined,
  type: z.literal(ApplicationTypeEnum.RECALL_BANKRUPTCY),
})
