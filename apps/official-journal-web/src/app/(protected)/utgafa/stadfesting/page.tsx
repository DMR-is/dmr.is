import { redirect } from 'next/navigation'

import { fetchQuery, HydrateClient } from '@dmr.is/trpc/client/server'

import { DepartmentEnum } from '../../../../gen/fetch'
import { Routes } from '../../../../lib/constants'
import { trpc } from '../../../../lib/trpc/client/server'
import { ConfirmPublishingClient } from './ConfirmPublishingClient'

function isDepartmentEnum(val: string): val is DepartmentEnum {
  return Object.values(DepartmentEnum).includes(val as DepartmentEnum)
}

export default async function ConfirmPublishingPage({
  searchParams,
}: {
  searchParams: Promise<{
    caseIds?: string | string[]
    department?: string
  }>
}) {
  const { caseIds: casesToPublish, department } = await searchParams

  if (!casesToPublish) {
    redirect(Routes.PublishingOverview)
  }

  const caseIds = Array.isArray(casesToPublish)
    ? casesToPublish
    : casesToPublish.split(',')

  if (!department || !isDepartmentEnum(department)) {
    redirect(Routes.PublishingOverview)
  }

  const casesData = await fetchQuery(
    trpc.getCasesWithPublicationNumber.queryOptions({
      department: department as DepartmentEnum,
      id: caseIds,
    }),
  )

  return (
    <HydrateClient>
      <ConfirmPublishingClient
        cases={casesData?.cases ?? []}
        department={department}
      />
    </HydrateClient>
  )
}
