'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { ApplicationSubmitted } from '../components/application/ApplicationSubmitted'
import { ApplicationDetailedDto } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

type Props = {
  application: ApplicationDetailedDto
}
export const ApplicationSubmittedContainer = ({ application }: Props) => {
  return (
    <ApplicationSubmitted
      adverts={application.adverts}
      applicationType={application.type}
      title={application.title}
      subtitle={application.subtitle ?? ''}
    />
  )

  // if (isLoading) {
  //   return <SkeletonLoader height={450} borderRadius="large" />
  // }

  // if (error) {
  //   return (
  //     <AlertMessage
  //       type="error"
  //       title="Villa kom upp"
  //       message="Vinsamlegast reyndu aftur síðar"
  //     />
  //   )
  // }

  // if (!data) {
  //   return (
  //     <AlertMessage
  //       type="warning"
  //       title="Engar birtingar fundust fyrir þessa auglýsingu"
  //       message="Vinsamlegast reyndu aftur síðar"
  //     />
  //   )
  // }

  // return (
  //   <ApplicationSubmitted
  //     adverts={data.adverts}
  //     applicationType={application.type}
  //     title={application.title}
  //     subtitle={application.subtitle ?? ''}
  //   />
  // )
}
