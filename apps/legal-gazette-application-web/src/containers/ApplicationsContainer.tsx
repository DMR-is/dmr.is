'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  AlertMessage,
  SkeletonLoader,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { ApplicationList } from '../components/application/ApplicationList'
import { UmsoknirHero } from '../components/hero/UmsoknirHero'
import { GetMyApplicationsRequest } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

type Props = {
  searchParams: GetMyApplicationsRequest
}

export function ApplicationsContainer({ searchParams }: Props) {
  const trpc = useTRPC()
  const { data, isLoading, error } = useQuery(
    trpc.getApplications.queryOptions(),
  )

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

  const { applications, paging } = data

  return (
    <Stack space={4}>
      <UmsoknirHero />
      <ApplicationList applications={applications ?? []} paging={paging} />
    </Stack>
  )
}
