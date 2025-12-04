'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is'

import { ApplicationSubmitted } from '../components/application/ApplicationSubmitted'
import { ApplicationDetailedDto } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

type Props = {
  application: ApplicationDetailedDto
}
export const ApplicationSubmittedContainer = ({ application }: Props) => {
  const trpc = useTRPC()
  const { data, error, isLoading } = useSuspenseQuery(
    trpc.getAdvertByCaseId.queryOptions({
      caseId: application.caseId,
    }),
  )

  if (isLoading) {
    return <SkeletonLoader height={450} borderRadius="large" />
  }

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa kom upp"
        message="Vinsamlegast reyndu aftur síðar"
      />
    )
  }

  if (!data) {
    return (
      <AlertMessage
        type="warning"
        title="Engar auglýsingar fundust fyrir þessa umsókn"
        message="Vinsamlegast reyndu aftur síðar"
      />
    )
  }

  return (
    <ApplicationSubmitted
      adverts={data.adverts}
      applicationType={application.type}
    />
  )
}
