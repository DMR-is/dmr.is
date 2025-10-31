import { UseFormProps } from 'react-hook-form'

import {
  ApplicationMetaDataSchema,
  CommunicationChannelSchema,
  DeepPartial,
  PublishingDatesSchema,
  RecallApplicationFieldsSchema,
  RecallApplicationSchema,
  recallApplicationSchema,
  SignatureSchema,
} from '@dmr.is/legal-gazette/schemas'

import { zodResolver } from '@hookform/resolvers/zod'

export type RecallFormProps = {
  metadata: ApplicationMetaDataSchema
  fields: DeepPartial<RecallApplicationFieldsSchema>
  signature: SignatureSchema
  publishingDates: PublishingDatesSchema[]
  communicationChannels: CommunicationChannelSchema[]
  additionalText?: string
}

export const recallForm = ({
  metadata,
  fields,
  signature,
  communicationChannels,
  publishingDates,
  additionalText,
}: RecallFormProps): UseFormProps<RecallApplicationSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(recallApplicationSchema),
  defaultValues: {
    metadata,
    fields,
    signature,
    communicationChannels,
    publishingDates,
    additionalText,
  },
})
