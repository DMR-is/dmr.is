import z from 'zod'

import { baseApplicationValidationSchema } from './base'
import { commonApplicationSchema } from './common'
import {
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
} from './recall'

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type CommonApplicationSchema = z.infer<typeof commonApplicationSchema>

export type RecallBankruptcyApplicationSchema = z.infer<
  typeof recallBankruptcyApplicationSchema
>

export type RecallDeceasedApplicationSchema = z.infer<
  typeof recallDeceasedApplicationSchema
>

export type BaseApplicationSchema = z.infer<
  typeof baseApplicationValidationSchema
>
