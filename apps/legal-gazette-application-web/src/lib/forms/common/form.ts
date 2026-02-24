import { UseFormProps } from 'react-hook-form'

import {
  CommonApplicationSchema,
  CommonApplicationWebSchema,
  commonApplicationWebSchema,
} from '@dmr.is/legal-gazette-schemas'

import { zodResolver } from '@hookform/resolvers/zod'

export type CommonApplicationWebMetadata =
  CommonApplicationWebSchema['metadata']

export type CommonFormProps = {
  metadata: CommonApplicationWebMetadata
  application: CommonApplicationSchema
}
export const commonForm = ({
  application,
  metadata,
}: CommonFormProps): UseFormProps<CommonApplicationWebSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(commonApplicationWebSchema),
  defaultValues: {
    metadata,
    ...application,
  },
})
