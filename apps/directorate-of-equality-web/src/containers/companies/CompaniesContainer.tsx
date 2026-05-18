'use client'

import { CompaniesView } from '../../components/companies/CompaniesView'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useSuspenseQuery } from '@tanstack/react-query'

export const CompaniesContainer = () => {
  const trpc = useTRPC()

  const { data: companiesData } = useSuspenseQuery(
    trpc.company.list.queryOptions({ pageSize: 1000 }),
  )
  const { data: reportsData } = useSuspenseQuery(
    trpc.reports.list.queryOptions({ status: ['APPROVED'], pageSize: 1000 }),
  )

  return (
    <CompaniesView
      companies={companiesData?.companies ?? []}
      approvedReports={reportsData?.reports ?? []}
    />
  )
}
