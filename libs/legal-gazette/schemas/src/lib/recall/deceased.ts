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
export const companySchema = z.object({
  companyName: z.string(),
  companyNationalId: z.string(),
})

export const recallDeceasedSchema = z.object({
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

export const recallDeceasedSchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: divisionMeetingSchemaRefined.optional(),
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

export const recallDeceasedAnswers = baseApplicationSchema.extend({
  fields: recallDeceasedSchema.optional(),
})

export const recallDeceasedAnswersRefined = baseApplicationSchemaRefined.extend(
  {
    fields: recallDeceasedSchemaRefined,
    publishingDates: publishingDatesRecallSchemaRefined,
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
