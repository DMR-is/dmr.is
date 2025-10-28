import { UseFormProps } from 'react-hook-form'

import {
  ApplicationMetaDataSchema,
  CommonApplicationFieldsSchema,
  CommonApplicationSchema,
  commonApplicationSchema,
  CommunicationChannelSchema,
  PublishingDatesSchema,
  SignatureSchema,
} from '@dmr.is/legal-gazette/schemas'

import { zodResolver } from '@hookform/resolvers/zod'
import { DeepPartial } from '@trpc/server'

export type CommonFormProps = {
  metadata: ApplicationMetaDataSchema
  fields: DeepPartial<CommonApplicationFieldsSchema>
  signature: SignatureSchema
  publishingDates: PublishingDatesSchema[]
  communicationChannels: CommunicationChannelSchema[]
}
export const commonForm = ({
  metadata,
  fields,
  signature,
  publishingDates,
  communicationChannels,
}: CommonFormProps): UseFormProps<CommonApplicationSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(commonApplicationSchema),
  defaultValues: {
    metadata,
    fields,
    signature,
    publishingDates,
    communicationChannels,
  },
})
