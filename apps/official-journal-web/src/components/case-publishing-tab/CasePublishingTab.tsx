import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import {
  AlertMessage,
  Box,
  Button,
  SkeletonLoader,
  Text,
} from '@island.is/island-ui/core'

import { Case, CaseStatusEnum, Paging } from '../../gen/fetch'
import { useCases } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { usePublishContext } from '../../hooks/usePublishContext'
import { messages as errorMessages } from '../../lib/messages/errors'
import { CaseOverviewSearchParams } from '../../lib/types'
import { CaseOverviewGrid } from '../case-overview-grid/CaseOverviewGrid'
import { CaseTableReady } from '../tables/CaseTableReady'
import { CaseTableSelectedCases } from '../tables/CaseTableSelectedCases'
import { messages } from './messages'

type Props = {
  cases: Case[]
  paging: Paging
  proceedToPublishing: (casesToPublish: string[]) => void
}

export const CasePublishingTab = ({
  cases,
  paging,
  proceedToPublishing,
}: Props) => {
  const { formatMessage } = useFormatMessage()
  const router = useRouter()

  const { selectedCaseIds } = usePublishContext()

  const selectedTab = router.query.department

  const [searchParams, setSearchParams] = useState<CaseOverviewSearchParams>({
    search: router.query.search,
    department: selectedTab,
    status: CaseStatusEnum.Tilbi,
    page: router.query.page,
    type: router.query.type,
    category: router.query.category,
    pageSize: router.query.pageSize,
  })

  useEffect(() => {
    setSearchParams({
      search: router.query.search,
      department: selectedTab,
      status: CaseStatusEnum.Tilbi,
      page: router.query.page,
      type: router.query.type,
      category: router.query.category,
      pageSize: router.query.pageSize,
    })
  }, [router.query])

  const qsp = useMemo(() => {
    const filters = Object.entries(searchParams).filter(
      ([_, value]) => value !== undefined,
    )

    const qs = new URLSearchParams()

    filters.forEach(([key, value]) => {
      qs.append(key, value as string)
    })

    return qs.toString()
  }, [searchParams])

  const {
    data: caseData,
    error,
    isLoading,
  } = useCases({
    qsp: qsp,
    options: {
      keepPreviousData: true,
      fallback: {
        cases: cases,
        paging: paging,
      },
    },
  })

  if (isLoading) {
    return (
      <CaseOverviewGrid>
        <SkeletonLoader repeat={3} height={44} />
      </CaseOverviewGrid>
    )
  }

  if (error) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="error"
          message={formatMessage(errorMessages.errorFetchingData)}
          title={formatMessage(errorMessages.internalServerError)}
        />
      </CaseOverviewGrid>
    )
  }

  if (!caseData) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="warning"
          message={formatMessage(errorMessages.noDataText)}
          title={formatMessage(errorMessages.noDataTitle)}
        />
      </CaseOverviewGrid>
    )
  }

  return (
    <>
      <Box>
        <CaseTableReady data={caseData.cases} paging={caseData.paging} />
      </Box>

      <Box marginTop={[3, 4]}>
        <Text as="h3" fontWeight="semiBold" marginBottom={2}>
          {formatMessage(messages.general.selectedCasesForPublishing)}
        </Text>
        <CaseTableSelectedCases />

        <Box marginTop={3} display="flex" justifyContent="flexEnd">
          <Button
            disabled={selectedCaseIds.length === 0}
            onClick={() => proceedToPublishing(selectedCaseIds)}
          >
            {formatMessage(messages.general.publishCases)}
          </Button>
        </Box>
      </Box>
    </>
  )
}
