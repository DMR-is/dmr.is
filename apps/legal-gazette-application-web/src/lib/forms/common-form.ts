import { UseFormProps } from 'react-hook-form'
import z from 'zod'

import {
  commonApplicationAnswers,
  CommonApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { zodResolver } from '@hookform/resolvers/zod'

const commonApplicationWebSchema = commonApplicationAnswers.extend({
  metadata: z.object({
    applicationId: z.string(),
    caseId: z.string(),
    typeOptions: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    ),
  }),
})

export type CommonApplicationWebSchema = z.infer<
  typeof commonApplicationWebSchema
>

export type CommonApplicationWebMetadata =
  CommonApplicationWebSchema['metadata']

export type CommonFormProps = {
  metadata: CommonApplicationWebMetadata
  application: CommonApplicationSchema
}
export const commonForm = ({
  metadata,
  application,
}: CommonFormProps): UseFormProps<CommonApplicationWebSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(commonApplicationWebSchema),
  defaultValues: {
    metadata,
    ...application,
  },
})
