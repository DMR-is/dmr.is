'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { type TagVariant } from '@dmr.is/ui/components/island-is/Tag'
import { TableCell } from '@dmr.is/ui/components/Tables/Table'

import { ReportStatusEnum } from '../../../gen/fetch/types.gen'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { type Case, COLUMN_STATUS } from '../constants'
import { CreateEqualityReportDrawer } from '../CreateEqualityReportDrawer'
import { CreateSalaryReportDrawer } from '../CreateSalaryReportDrawer'
import { TabContent } from './TabContent'

import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

const STATUS_VARIANT: Record<string, TagVariant> = {
  Samþykkt: 'mint',
  Hafnað: 'red',
  Úrelt: 'dark',
  'Í vinnslu': 'blue',
  Innsent: 'rose',
  Drög: 'purple',
}

const statusColumn: ColumnDef<Case> = {
  ...COLUMN_STATUS,
  cell: ({ getValue }) => {
    const status = getValue<string>()
    if (!status) return null
    return (
      <TableCell
        items={{
          type: 'tag',
          variant: STATUS_VARIANT[status] ?? 'blue',
          children: status,
        }}
      />
    )
  },
}

const IN_REVIEW = [ReportStatusEnum.IN_REVIEW]
const PROCESSED = [
  ReportStatusEnum.APPROVED,
  ReportStatusEnum.DENIED,
  ReportStatusEnum.SUPERSEDED,
]

export const TabsContainer = () => {
  const trpc = useTRPC()

  const { data: allData } = useQuery(
    trpc.reports.list.queryOptions({ pageSize: 1 }),
  )
  const { data: inReviewData } = useQuery(
    trpc.reports.list.queryOptions({ pageSize: 1, status: IN_REVIEW }),
  )
  const { data: processedData } = useQuery(
    trpc.reports.list.queryOptions({ pageSize: 1, status: PROCESSED }),
  )

  const allCount = allData?.paging.totalItems ?? '0'
  const inReviewCount = inReviewData?.paging.totalItems ?? '0'
  const processedCount = processedData?.paging.totalItems ?? '0'

  return (
    <GridContainer>
      <Box display="flex" justifyContent="flexEnd" marginBottom={3}>
        <Inline space={2}>
          <CreateEqualityReportDrawer />
          <CreateSalaryReportDrawer />
        </Inline>
      </Box>
      <Tabs
        label="Mál"
        selected="innsendingar"
        contentBackground="blue100"
        size="sm"
        tabs={[
          {
            id: 'innsendingar',
            label: `Innsendingar (${allCount})`,
            content: <TabContent expandable />,
          },
          {
            id: 'i-vinnslu',
            label: `Í vinnslu (${inReviewCount})`,
            content: (
              <TabContent
                fixedQuery={{ status: IN_REVIEW }}
                extraColumns={[statusColumn]}
              />
            ),
          },
          {
            id: 'afgreitt',
            label: `Afgreitt (${processedCount})`,
            content: (
              <TabContent
                fixedQuery={{ status: PROCESSED }}
                extraColumns={[statusColumn]}
              />
            ),
          },
        ]}
      />
    </GridContainer>
  )
}
