import addDays from 'date-fns/addDays'
import { UseFormProps } from 'react-hook-form'

import { CommonApplicationDto } from '../../gen/fetch'
import { CommonFormSchema, commonFormSchema } from './schemas/common-schema'

import { zodResolver } from '@hookform/resolvers/zod'

type Params = {
  caseId: string
  applicationId: string
  categoryOptions?: { label: string; value: string }[]
  application: CommonApplicationDto
}
export const commonForm = ({
  caseId,
  applicationId,
  categoryOptions,
  application,
}: Params): UseFormProps<CommonFormSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(commonFormSchema),
  defaultValues: {
    meta: {
      caseId,
      applicationId,
      categoryOptions: categoryOptions,
    },
    fields: {
      caption: application.caption ?? undefined,
      category: application.categoryId ?? undefined,
      html: application.html ?? undefined,
      signatureName: application.signatureName ?? undefined,
      signatureLocation: application.signatureLocation ?? undefined,
      signatureDate: application.signatureDate
        ? new Date(application.signatureDate)
        : undefined,
      publishingDates: application.publishingDates
        ? application.publishingDates.map((date) => new Date(date))
        : [addDays(new Date(), 14)],
    },
  },
})
