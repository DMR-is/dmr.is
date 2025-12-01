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

export const recallBankruptcySchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchema.optional(),
  divisionMeetingFields: divisionMeetingSchema.optional(),
  settlementFields: settlementSchema.extend({
    deadlineDate: z.string().optional().nullable(),
  }),
})

export const recallBankruptcySchemaRefined = z.object({
  courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
  divisionMeetingFields: divisionMeetingSchemaRefined,
  settlementFields: settlementSchemaRefined.extend({
    deadlineDate: z.iso.datetime().refine((date) => isDateString(date), {
      message: 'Frestdagur bús er nauðsynlegur',
    }),
  }),
})

export const recallBankruptcyAnswersSchema = baseApplicationSchema.extend({
  fields: recallBankruptcySchema,
})

export const recallBankruptcyAnswersSchemaRefined =
  baseApplicationSchemaRefined.extend({
    fields: recallBankruptcySchemaRefined,
    publishingDates: publishingDatesRecallSchemaRefined,
  })

export const recallBankruptcyApplicationSchema = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_BANKRUPTCY),
  answers: recallBankruptcyAnswersSchema.optional(),
})

export const recallBankruptcyApplicationSchemaRefined = z.object({
  type: z.literal(ApplicationTypeEnum.RECALL_BANKRUPTCY),
  answers: recallBankruptcyAnswersSchemaRefined,
})

export const isRecallBankruptcyApplicationSchema = (
  obj: unknown,
): obj is z.infer<typeof recallBankruptcyApplicationSchema> => {
  const parseResult = recallBankruptcyApplicationSchema.safeParse(obj)
  return parseResult.success
}

export const isRecallBankruptcyApplicationSchemaRefined = (
  obj: unknown,
): obj is z.infer<typeof recallBankruptcyApplicationSchemaRefined> => {
  const parseResult = recallBankruptcyApplicationSchemaRefined.safeParse(obj)
  return parseResult.success
}
