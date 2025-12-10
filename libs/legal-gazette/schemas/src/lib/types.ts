import z from 'zod'

import {
  baseApplicationSchemaRefined,
  baseApplicationWebSchema,
} from './base/application'
import {
  commonApplicationAnswers,
  commonApplicationSchema,
  commonApplicationWebSchema,
} from './common/application'
import {
  recallBankruptcyAnswers,
  recallBankruptcyApplicationSchema,
} from './recall/bankruptcy'
import {
  companySchema,
  recallDeceasedAnswers,
  recallDeceasedApplicationSchema,
} from './recall/deceased'
import {
  recallApplicationAnswers,
  recallApplicationSchema,
  recallApplicationWebSchema,
} from './recall'

export type CommonApplicationSchema = z.infer<typeof commonApplicationSchema>

export type CommonApplicationAnswers = z.infer<typeof commonApplicationAnswers>

export type RecallBankruptcyApplicationSchema = z.infer<
  typeof recallBankruptcyApplicationSchema
>

export type RecallBankruptcyApplicationAnswers = z.infer<
  typeof recallBankruptcyAnswers
>

export type RecallDeceasedApplicationSchema = z.infer<
  typeof recallDeceasedApplicationSchema
>

export type RecallDeceasedApplicationAnswers = z.infer<
  typeof recallDeceasedAnswers
>

export type RecallApplicationSchema = z.infer<typeof recallApplicationSchema>

export type RecallApplicationAnswers = z.infer<typeof recallApplicationAnswers>

export type BaseApplicationSchema = z.infer<typeof baseApplicationSchemaRefined>

export type CommonApplicationWebSchema = z.infer<
  typeof commonApplicationWebSchema
>

export type BaseApplicationWebSchema = z.infer<typeof baseApplicationWebSchema>

export type RecallApplicationWebSchema = z.infer<
  typeof recallApplicationWebSchema
>

export type CompanySchema = z.infer<typeof companySchema>
