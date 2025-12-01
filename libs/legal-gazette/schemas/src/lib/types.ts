import z from 'zod'

import { baseApplicationSchemaRefined } from './base/application'
import {
  commonApplicationAnswers,
  commonApplicationSchema,
} from './common/application'
import { recallBankruptcyApplicationSchema } from './recall/bankruptcy'
import { recallDeceasedApplicationSchema } from './recall/deceased'

export type CommonApplicationSchema = z.infer<typeof commonApplicationSchema>

export type CommonApplicationAnswers = z.infer<typeof commonApplicationAnswers>

export type RecallBankruptcyApplicationSchema = z.infer<
  typeof recallBankruptcyApplicationSchema
>

export type RecallBankruptcyApplicationAnswers =
  RecallBankruptcyApplicationSchema['answers']

export type RecallDeceasedApplicationSchema = z.infer<
  typeof recallDeceasedApplicationSchema
>

export type RecallDeceasedApplicationAnswers =
  RecallDeceasedApplicationSchema['answers']

export type BaseApplicationSchema = z.infer<typeof baseApplicationSchemaRefined>
