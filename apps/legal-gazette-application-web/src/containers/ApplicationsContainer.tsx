'use client'

import {
  AlertMessage,
  SkeletonLoader,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { ApplicationList } from '../components/application/ApplicationList'
import { UmsoknirHero } from '../components/hero/UmsoknirHero'
import { GetMyApplicationsRequest } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type Props = {
  searchParams: GetMyApplicationsRequest
}

export function ApplicationsContainer({ searchParams }: Props) {
  const { data, isLoading, error } =
    trpc.applicationApi.getApplications.useQuery()

  if (isLoading) {
    return (
      <SkeletonLoader repeat={3} height={200} borderRadius="large" space={3} />
    )
  }

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa við að sækja umsóknir"
        message="Vinsamlegast reynið aftur síðar"
      />
    )
  }

  if (!data) {
    return <AlertMessage type="info" title="Engar umsóknir fundust" />
  }

  const { applications, ...paging } = data

  return (
    <Stack space={4}>
      <UmsoknirHero />
      <ApplicationList applications={applications ?? []} paging={paging} />
    </Stack>
  )
}
