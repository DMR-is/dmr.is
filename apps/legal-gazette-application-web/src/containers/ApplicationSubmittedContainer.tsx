'use client'

import { AlertMessage } from '@dmr.is/ui/components/island-is'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is'

import { ApplicationSubmitted } from '../components/application/ApplicationSubmitted'
import { ApplicationDetailedDto } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type Props = {
  application: ApplicationDetailedDto
}
export const ApplicationSubmittedContainer = ({ application }: Props) => {
  const { data, error, isLoading } = trpc.advertsApi.getAdvertByCaseId.useQuery(
    {
      caseId: application.caseId,
    },
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
      applicationType={application.applicationType}
    />
  )
}
