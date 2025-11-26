import z from 'zod'

import {
  baseApplicationSchema,
  baseEntitySchema,
  communicationChannelSchema,
  signatureSchema,
} from './base'
import {
  commonApplicationFieldsScehma,
  commonApplicationSchema,
} from './common'
import {
  courtAndJudgmentFieldsSchema,
  divisionMeetingFieldsSchema,
  liquidatorFieldsSchema,
  recallApplicationFieldsSchema,
  recallApplicationSchema,
  recallDeceasedApplicationFieldsSchema,
  recallDeceasedDivisionMeetingFieldsSchema,
  settlementFieldsSchema,
} from './recall'

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type BaseEntitySchema = z.infer<typeof baseEntitySchema>

export type CommunicationChannelSchema = z.infer<
  typeof communicationChannelSchema
>

export type SignatureSchema = z.infer<typeof signatureSchema>

export type CommonApplicationFieldsSchema = z.infer<
  typeof commonApplicationFieldsScehma
>

export type CommonApplicationSchema = z.infer<typeof commonApplicationSchema>

export type BaseApplicationSchema = z.infer<typeof baseApplicationSchema>

export type CourtAndJudgmentFieldsSchema = z.infer<
  typeof courtAndJudgmentFieldsSchema
>

export type SettlementFieldsSchema = z.infer<typeof settlementFieldsSchema>

export type LiquidatorFieldsSchema = z.infer<typeof liquidatorFieldsSchema>

export type DivisionMeetingFieldsSchema = z.infer<
  typeof divisionMeetingFieldsSchema
>

export type RecallBankruptcyApplicationFieldsSchema = z.infer<
  typeof recallApplicationFieldsSchema
>

export type RecallDeceasedApplicationFieldsSchema = z.infer<
  typeof recallDeceasedApplicationFieldsSchema
>

export type RecallBankruptcyApplicationSchema = z.infer<
  typeof recallApplicationSchema
>

export type RecallDeceasedDivisionMeetingFieldsSchema = z.infer<
  typeof recallDeceasedDivisionMeetingFieldsSchema
>

export type RecallApplicationFieldsSchema = z.infer<
  typeof recallApplicationFieldsSchema
>

export type RecallApplicationSchema = z.infer<typeof recallApplicationSchema>
