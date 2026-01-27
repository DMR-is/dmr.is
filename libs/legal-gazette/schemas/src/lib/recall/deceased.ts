import { isDateString, isString } from 'class-validator'
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
import { divisionMeetingSchema } from './division-meeting'
import { settlementSchema, settlementSchemaRefined } from './settlement'
export const companySchema = z.object({
  companyName: z.string(),
  companyNationalId: z.string(),
})

// Modern schema with single date field
export const recallDeceasedSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      date: z.string().optional().nullable(),
      type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
      companies: z.array(companySchema).optional(),
    })
    .optional(),
})

// Legacy schema for backward compatibility (existing applications)
export const recallDeceasedSchemaLegacy = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema
    .extend({
      dateOfDeath: z.string().optional().nullable(),
      type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
      companies: z.array(companySchema).optional(),
    })
    .optional(),
})

// Modern refined schema
export const recallDeceasedSchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: z
    .object({
      meetingDate: z.string().optional().nullable(),
      meetingLocation: z.string().optional().nullable(),
    })
    .optional(),
  settlementFields: settlementSchemaRefined
    .extend({
      date: z.iso
        .datetime('Dánardagur bús er nauðsynlegur')
        .refine((date) => isDateString(date), {
          message: 'Dánardagur bús er nauðsynlegur',
        }),
      companies: z.array(companySchema).optional(),
      type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
    })
    .refine(
      (settlement) => {
        if (settlement.type === 'OWNER') {
          return settlement.companies && settlement.companies.length > 0
        }
        return true
      },
      {
        message: 'Aðeins fyrirtæki sem eigendur eru leyfðir',
        path: ['companies'],
      },
    ),
})

// Legacy refined schema for backward compatibility
export const recallDeceasedSchemaRefinedLegacy = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: z
    .object({
      meetingDate: z.string().optional().nullable(),
      meetingLocation: z.string().optional().nullable(),
    })
    .optional(),
  settlementFields: settlementSchemaRefined
    .extend({
      dateOfDeath: z.iso
        .datetime('Dánardagur bús er nauðsynlegur')
        .refine((date) => isDateString(date), {
          message: 'Dánardagur bús er nauðsynlegur',
        }),
      companies: z.array(companySchema).optional(),
      type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
    })
    .refine(
      (settlement) => {
        if (settlement.type === 'OWNER') {
          return settlement.companies && settlement.companies.length > 0
        }
        return true
      },
      {
        message: 'Aðeins fyrirtæki sem eigendur eru leyfðir',
        path: ['companies'],
      },
    ),
})

// Modern answers schema
export const recallDeceasedAnswers = baseApplicationSchema.extend({
  fields: recallDeceasedSchema.optional(),
})

// Legacy answers schema
export const recallDeceasedAnswersLegacy = baseApplicationSchema.extend({
  fields: recallDeceasedSchemaLegacy.optional(),
})

// Modern refined answers
export const recallDeceasedAnswersRefined = baseApplicationSchemaRefined.extend(
  {
    fields: recallDeceasedSchemaRefined,
    publishingDates: publishingDatesRecallSchemaRefined,
  },
)

// Legacy refined answers
export const recallDeceasedAnswersRefinedLegacy =
  baseApplicationSchemaRefined.extend({
    fields: recallDeceasedSchemaRefinedLegacy,
    publishingDates: publishingDatesRecallSchemaRefined,
  })

// Modern application schema
export const recallDeceasedApplicationSchema = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_DECEASED),
  answers: recallDeceasedAnswers.optional(),
})

// Legacy application schema
export const recallDeceasedApplicationSchemaLegacy = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_DECEASED),
  answers: recallDeceasedAnswersLegacy.optional(),
})

// Modern refined application schema
export const recallDeceasedApplicationSchemaRefined = z.object({
  ...recallDeceasedAnswersRefined.extend({
    publishingDates: publishingDatesRecallSchemaRefined,
  }),
  type: z.literal(ApplicationTypeEnum.RECALL_DECEASED),
})
