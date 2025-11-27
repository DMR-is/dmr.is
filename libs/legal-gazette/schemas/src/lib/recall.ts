import { isDateString, isString, isUUID } from 'class-validator'
import Kennitala from 'kennitala'
import z from 'zod'

import { baseApplicationValidationSchema } from './base'
import {
  ApplicationRequirementStatementEnum,
  ApplicationTypeEnum,
  ApplicationTypeSchema,
} from './constants'

export const courtAndJudgmentFieldsSchema = z.object({
  courtDistrictId: z.string().optional(),
  judgmentDate: z.string().optional(),
})

export const courtAndJudgmentValidationFieldsSchema = z.object({
  courtDistrictId: z.string().refine((id) => isUUID(id), {
    message: 'Dómstóll er nauðsynlegur',
  }),
  judgmentDate: z.iso.datetime().refine((date) => isDateString(date), {
    message: 'Úrskurðar dagsetning er nauðsynlegur',
  }),
})

export const settlementFieldsSchema = z.object({
  name: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  liquidatorName: z.string().optional(),
  liquidatorLocation: z.string().optional(),
  recallRequirementStatementType: z
    .enum(ApplicationRequirementStatementEnum)
    .optional(),
  recallRequirementStatementLocation: z.string().optional(),
})

export const settlementValidationFieldsSchema = z.object({
  name: z.string().refine((name) => isString(name) && name.length > 0, {
    message: 'Nafn bús er nauðsynlegt',
  }),
  nationalId: z.string().refine((nationalId) => Kennitala.isValid(nationalId), {
    message: 'Kennitala bús er nauðsynleg',
  }),
  address: z
    .string()
    .refine((address) => isString(address) && address.length > 0, {
      message: 'Heimilisfang bús er nauðsynlegt',
    }),
  liquidatorName: z
    .string()
    .refine((name) => isString(name) && name.length > 0, {
      message: 'Nafn skiptastjóra er nauðsynlegt',
    }),
  liquidatorLocation: z
    .string()
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Staðsetning skiptastjóra er nauðsynleg',
    }),
  recallRequirementStatementType: z
    .enum(ApplicationRequirementStatementEnum)
    .optional(),
  recallRequirementStatementLocation: z.string().optional(),
})

export const divisionMeetingFieldsSchema = z.object({
  meetingDate: z
    .string()
    .optional()
    .refine((date) => date && isDateString(date), {
      message: 'Fundardagur er nauðsynlegur',
    }),
  meetingLocation: z
    .string()
    .optional()
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Fundarstaður er nauðsynlegur',
    }),
})

export const recallDeceasedDivisionMeetingFieldsSchema = z.object({
  meetingDate: z.string().nullable().optional(),
  meetingLocation: z.string().nullable().optional(),
})

export const divisionMeetingValidationFieldsSchema = z.object({
  meetingDate: z.iso.datetime().refine((date) => isDateString(date), {
    message: 'Fundardagur er nauðsynlegur',
  }),
  meetingLocation: z
    .string()
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Fundarstaður er nauðsynlegur',
    }),
})

export const recallBankruptcyFieldsSchema = z.object({
  type: ApplicationTypeSchema.enum.RECALL_BANKRUPTCY,
  courtAndJudgmentFields: courtAndJudgmentFieldsSchema,
  settlementFields: settlementFieldsSchema.extend({
    deadlineDate: z
      .string()
      .optional()
      .refine((date) => isDateString(date), {
        message: 'Frestdagur bús er nauðsynlegur',
      }),
  }),
  divisionMeetingFields: divisionMeetingFieldsSchema,
})

export const recallBankruptcyApplicationValidationFieldsSchema = z.object({
  type: ApplicationTypeSchema.enum.RECALL_BANKRUPTCY,
  courtAndJudgmentFields: courtAndJudgmentValidationFieldsSchema,
  settlementFields: settlementValidationFieldsSchema.extend({
    deadlineDate: z.iso
      .datetime()
      .optional()
      .refine((date) => isDateString(date), {
        message: 'Frestdagur bús er nauðsynlegur',
      }),
  }),
  divisionMeetingFields: divisionMeetingValidationFieldsSchema,
})

export const recallDeceasedFieldsSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentValidationFieldsSchema,
  settlementFields: settlementFieldsSchema.extend({
    dateOfDeath: z.iso
      .datetime()
      .optional()
      .refine((date) => isDateString(date), {
        message: 'Dánardagur bús er nauðsynlegur',
      }),
  }),
  divisionMeetingFields: recallDeceasedDivisionMeetingFieldsSchema.optional(),
})

export const recallDeceasedApplicationValidationFieldsSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentFieldsSchema,
  settlementFields: settlementValidationFieldsSchema.extend({
    dateOfDeath: z.iso
      .datetime()
      .optional()
      .refine((date) => isDateString(date), {
        message: 'Dánardagur bús er nauðsynlegur',
      }),
  }),
  divisionMeetingFields: recallDeceasedDivisionMeetingFieldsSchema.optional(),
})

export const recallPublishingDatesSchema = z.object({
  publishingDates: z
    .array(z.iso.datetime())
    .refine((dates) => dates.length >= 2 && dates.length <= 3, {
      message:
        'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
    }),
})

export const recallBankruptcyApplicationSchema = z.object({
  type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
  answers: baseApplicationValidationSchema.extend({
    fields: recallBankruptcyFieldsSchema,
  }),
})

export const recallDeceasedApplicationSchema = z.object({
  type: ApplicationTypeEnum.RECALL_DECEASED,
  answers: baseApplicationValidationSchema.extend({
    fields: recallDeceasedFieldsSchema,
  }),
})

export const recallApplicationValidationSchema = z.discriminatedUnion('type', [
  baseApplicationValidationSchema.extend({
    type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
    answers: recallBankruptcyApplicationValidationFieldsSchema,
    publishingDates: z
      .array(z.iso.datetime())
      .refine((dates) => dates.length >= 2 && dates.length <= 3, {
        message:
          'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
      }),
  }),
  baseApplicationValidationSchema.extend({
    type: ApplicationTypeEnum.RECALL_DECEASED,
    answers: recallDeceasedApplicationValidationFieldsSchema,
    publishingDates: z
      .array(z.iso.datetime())
      .refine((dates) => dates.length >= 2 && dates.length <= 3, {
        message:
          'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
      }),
  }),
])

export const isRecallBankruptcyApplication = (
  application: any,
): application is z.infer<typeof recallBankruptcyApplicationSchema> & {
  type: ApplicationTypeEnum.RECALL_BANKRUPTCY
  answers: z.infer<typeof baseApplicationValidationSchema> & {
    fields: z.infer<typeof recallBankruptcyFieldsSchema>
  }
} => {
  const parseResult = recallBankruptcyApplicationSchema.safeParse(application)
  return parseResult.success
}

export const isRecallDeceasedApplication = (
  application: any,
): application is z.infer<typeof recallDeceasedApplicationSchema> & {
  type: ApplicationTypeEnum.RECALL_DECEASED
  answers: z.infer<typeof baseApplicationValidationSchema> & {
    fields: z.infer<typeof recallDeceasedFieldsSchema>
  }
} => {
  const parseResult = recallDeceasedApplicationSchema.safeParse(application)
  return parseResult.success
}
