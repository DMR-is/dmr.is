'use client'

import { Stack } from '@island.is/island-ui/core'

import { ApplicationList } from '../components/client-components/application/ApplicationList'
import { UmsoknirHero } from '../components/client-components/hero/UmsoknirHero'
import { GetMyApplicationsRequest } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'

type Props = {
  searchParams: GetMyApplicationsRequest
}

export function ApplicationsContainer({ searchParams }: Props) {
  const [result] = trpc.applicationApi.getApplications.useSuspenseQuery({
    page: searchParams.page,
    pageSize: searchParams.pageSize,
  })

  const { applications, ...paging } = result

  return (
    <Stack space={4}>
      <UmsoknirHero />
      <ApplicationList applications={result.applications} paging={paging} />
    </Stack>
  )
}
