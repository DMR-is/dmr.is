import z from 'zod'

import {
  baseApplicationSchema,
  commonApplicationFields,
  commonApplicationSchema,
} from './base'
import {
  applicationMetaDataSchema,
  baseEntitySchema,
  communicationChannelSchema,
  optionSchema,
  publishingDatesSchema,
  signatureSchema,
} from './shared'

export type BaseEntitySchema = z.infer<typeof baseEntitySchema>

export type CommunicationChannelSchema = z.infer<
  typeof communicationChannelSchema
>

export type OptionSchema = z.infer<typeof optionSchema>

export type ApplicationMetaDataSchema = z.infer<
  typeof applicationMetaDataSchema
>

export type SignatureSchema = z.infer<typeof signatureSchema>

export type PublishingDatesSchema = z.infer<typeof publishingDatesSchema>

export type CommonApplicationFieldsSchema = z.infer<
  typeof commonApplicationFields
>

export type CommonApplicationSchema = z.infer<typeof commonApplicationSchema>

export type BaseApplicationSchema = z.infer<typeof baseApplicationSchema>

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
