import { isDateString, isString, isUUID } from 'class-validator'
import Kennitala from 'kennitala'
import z from 'zod'

import { baseApplicationSchema } from './base'
import {
  ApplicationRequirementStatementEnum,
  ApplicationTypeEnum,
  ApplicationTypeSchema,
} from './constants'

export const courtAndJudgmentFieldsSchema = z.object({
  courtDistrictId: z
    .string()
    .optional()
    .refine((id) => id && isUUID(id), {
      message: 'Dómstóll er nauðsynlegur',
    }),
  judgmentDate: z
    .string()
    .optional()
    .refine((date) => date && isDateString(date), {
      message: 'Úrskurðar dagsetning er nauðsynlegur',
    }),
})

export const curtAndJudgmentValidationFieldsSchema = z.object({
  courtDistrictId: z.string().refine((id) => isUUID(id), {
    message: 'Dómstóll er nauðsynlegur',
  }),
  judgmentDate: z.iso.datetime().refine((date) => isDateString(date), {
    message: 'Úrskurðar dagsetning er nauðsynlegur',
  }),
})

export const settlementFieldsSchema = z.object({
  name: z
    .string()
    .optional()
    .refine((name) => isString(name) && name.length > 0, {
      message: 'Nafn bús er nauðsynlegt',
    }),
  nationalId: z
    .string()
    .optional()
    .refine(
      (nationalId) => {
        return nationalId && Kennitala.isValid(nationalId)
      },
      {
        message: 'Kennitala bús er nauðsynleg',
      },
    ),
  address: z
    .string()
    .optional()
    .refine((address) => isString(address) && address.length > 0, {
      message: 'Heimilisfang bús er nauðsynlegt',
    }),
  liquidatorName: z
    .string()
    .optional()
    .refine((name) => isString(name) && name.length > 0, {
      message: 'Nafn skiptastjóra er nauðsynlegt',
    }),
  liquidatorLocation: z
    .string()
    .optional()
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Staðsetning skiptastjóra er nauðsynleg',
    }),
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

export const liquidatorFieldsSchema = z.object({
  name: z
    .string()
    .optional()
    .refine((name) => isString(name) && name.length > 0, {
      message: 'Nafn skiptastjóra er nauðsynlegt',
    }),
  location: z
    .string()
    .optional()
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

export const recallBankruptcyApplicationFieldsSchema = z.object({
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
  liquidatorFields: liquidatorFieldsSchema,
  divisionMeetingFields: divisionMeetingFieldsSchema,
})

export const recallBankruptcyApplicationValidationFieldsSchema = z.object({
  type: ApplicationTypeSchema.enum.RECALL_BANKRUPTCY,
  courtAndJudgmentFields: curtAndJudgmentValidationFieldsSchema,
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

export const recallDeceasedApplicationFieldsSchema = z.object({
  courtAndJudgmentFields: curtAndJudgmentValidationFieldsSchema,
  settlementFields: settlementFieldsSchema.extend({
    dateOfDeath: z.iso
      .datetime()
      .optional()
      .refine((date) => isDateString(date), {
        message: 'Dánardagur bús er nauðsynlegur',
      }),
  }),
  liquidatorFields: liquidatorFieldsSchema,
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

export const recallApplicationFieldsSchema = z.discriminatedUnion('type', [
  recallBankruptcyApplicationFieldsSchema.extend({
    type: ApplicationTypeSchema.enum.RECALL_BANKRUPTCY,
  }),
  recallDeceasedApplicationFieldsSchema.extend({
    type: ApplicationTypeSchema.enum.RECALL_DECEASED,
  }),
])

export const recallApplicationValidationFieldsSchema = z.discriminatedUnion(
  'type',
  [
    recallBankruptcyApplicationValidationFieldsSchema.extend({
      type: ApplicationTypeSchema.enum.RECALL_BANKRUPTCY,
    }),
    recallDeceasedApplicationValidationFieldsSchema.extend({
      type: ApplicationTypeSchema.enum.RECALL_DECEASED,
    }),
  ],
)

export const recallPublishingDatesSchema = z.object({
  publishingDates: z
    .array(z.iso.datetime())
    .refine((dates) => dates.length >= 2 && dates.length <= 3, {
      message:
        'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
    }),
})

export const recallApplicationSchema = z.discriminatedUnion('type', [
  baseApplicationSchema.extend({
    type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
    answers: recallBankruptcyApplicationFieldsSchema,
    publishingDates: recallPublishingDatesSchema,
  }),
  baseApplicationSchema.extend({
    type: ApplicationTypeEnum.RECALL_DECEASED,
    answers: recallDeceasedApplicationFieldsSchema,
    publishingDates: recallPublishingDatesSchema,
  }),
])

export const recallApplicationValidationSchema = z.discriminatedUnion('type', [
  baseApplicationSchema.extend({
    type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
    answers: recallBankruptcyApplicationValidationFieldsSchema,
    publishingDates: z
      .array(z.iso.datetime())
      .refine((dates) => dates.length >= 2 && dates.length <= 3, {
        message:
          'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
      }),
  }),
  baseApplicationSchema.extend({
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
  application: z.infer<typeof recallApplicationSchema>,
): application is z.infer<typeof recallApplicationSchema> & {
  type: ApplicationTypeEnum.RECALL_BANKRUPTCY
  answers: z.infer<typeof recallBankruptcyApplicationFieldsSchema>
} => {
  return application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY
}

export const isRecallDeceasedApplication = (
  application: z.infer<typeof recallApplicationSchema>,
): application is z.infer<typeof recallApplicationSchema> & {
  type: ApplicationTypeEnum.RECALL_DECEASED
  answers: z.infer<typeof recallDeceasedApplicationFieldsSchema>
} => {
  return application.type === ApplicationTypeEnum.RECALL_DECEASED
}

export const isValidatedRecallBankruptcyApplication = (
  application: z.infer<typeof recallApplicationValidationSchema>,
): application is z.infer<typeof recallApplicationValidationSchema> & {
  type: ApplicationTypeEnum.RECALL_BANKRUPTCY
  answers: z.infer<typeof recallBankruptcyApplicationValidationFieldsSchema>
} => {
  return application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY
}

export const isValidatedRecallDeceasedApplication = (
  application: z.infer<typeof recallApplicationValidationSchema>,
): application is z.infer<typeof recallApplicationValidationSchema> & {
  type: ApplicationTypeEnum.RECALL_DECEASED
  answers: z.infer<typeof recallDeceasedApplicationValidationFieldsSchema>
} => {
  return application.type === ApplicationTypeEnum.RECALL_DECEASED
}
// ...existing code...
