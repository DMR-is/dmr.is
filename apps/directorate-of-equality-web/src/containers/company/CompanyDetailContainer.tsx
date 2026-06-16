'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { ReportStatusEnum } from '../../gen/fetch'
import { useCompanies } from '../../hooks/useCompanies'
import { companiesText, serverErrorText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { CompanyContainer } from './CompanyContainer'

type CompanyDetailContainerProps = {
  id: string
}

export function CompanyDetailContainer({ id }: CompanyDetailContainerProps) {
  const { data, isLoading, isError } = useCompanies({})

  const trpc = useTRPC()
  const { data: reportsData } = useQuery(
    trpc.reports.list.queryOptions({
      status: [ReportStatusEnum.APPROVED],
      pageSize: 500,
    }),
  )
  const approvedReports = reportsData?.reports ?? []

  if (isLoading) {
    return (
      <Box paddingY={4}>
        <SkeletonLoader repeat={4} height={40} space={2} />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box paddingY={4}>
        <AlertMessage
          type="error"
          title={serverErrorText.title}
          message={serverErrorText.message}
        />
      </Box>
    )
  }

  const company = data?.companies.find((c) => c.id === id)

  if (!company) {
    return (
      <Box paddingY={4}>
        <AlertMessage
          type="warning"
          title={companiesText.detailView.noCompany}
          message=""
        />
      </Box>
    )
  }

  return (
    <CompanyContainer company={company} approvedReports={approvedReports} />
  )
}
