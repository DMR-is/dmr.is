import { UseFormProps } from 'react-hook-form'

import {
  RecallApplicationSchema,
  RecallApplicationWebSchema,
  recallApplicationWebSchema,
} from '@dmr.is/legal-gazette-schemas'

import { zodResolver } from '@hookform/resolvers/zod'

export type RecallApplicationWebMetadata =
  RecallApplicationWebSchema['metadata']

export type RecallFormProps = {
  metadata: RecallApplicationWebMetadata
  application: RecallApplicationSchema
}

export const recallForm = ({
  metadata,
  application,
}: RecallFormProps): UseFormProps<RecallApplicationWebSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(recallApplicationWebSchema),
  defaultValues: {
    metadata,
    ...application,
  },
})
