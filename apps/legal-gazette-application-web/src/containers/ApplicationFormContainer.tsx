'use client'

import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'

import { ApplicationStatusEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'
import { ApplicationSubmittedContainer } from './ApplicationSubmittedContainer'
import { CommonFormContainer } from './CommonFormContainer'
import { RecallFormContainer } from './RecallFormContainer'

import { useSuspenseQuery } from '@tanstack/react-query'

type Props = {
  applicationId: string
  type: ApplicationTypeEnum
}

export function ApplicationFormContainer({ applicationId, type }: Props) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(
    trpc.getApplicationById.queryOptions({ id: applicationId }),
  )

  if (data.status !== ApplicationStatusEnum.DRAFT) {
    return <ApplicationSubmittedContainer applicationId={applicationId} />
  }

  let Component = (
    <AlertMessage
      type="error"
      title="Tegund auglýsingar finnst ekki"
      message="Athugaðu hvort tegund auglýsingar sé rétt í slóðinni"
    />
  )

  switch (type) {
    case ApplicationTypeEnum.COMMON: {
      Component = <CommonFormContainer application={data} />

      break
    }
    default: {
      Component = <RecallFormContainer application={data} />
    }
  }

  return Component
}
