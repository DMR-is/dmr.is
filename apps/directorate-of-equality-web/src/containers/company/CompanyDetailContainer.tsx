'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { companiesText, serverErrorText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { CompanyContainer } from './CompanyContainer'

type CompanyDetailContainerProps = {
  id: string
}

export function CompanyDetailContainer({ id }: CompanyDetailContainerProps) {
  const trpc = useTRPC()
  const {
    data: company,
    isLoading,
    isError,
  } = useQuery(trpc.company.get.queryOptions({ id }))

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

  return <CompanyContainer company={company} />
}
