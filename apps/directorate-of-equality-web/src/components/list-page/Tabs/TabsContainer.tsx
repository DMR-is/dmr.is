'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { type TagVariant } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { TableCell } from '@dmr.is/ui/components/Tables/Table'

import {
  type ReportListItemDto,
  ReportStatusEnum,
} from '../../../gen/fetch/types.gen'
import { useReports } from '../../../hooks/useReports'
import { type Case, COLUMN_STATUS, COLUMNS } from '../constants'
import { CreateEqualityReportDrawer } from '../CreateEqualityReportDrawer'
import { CreateSalaryReportDrawer } from '../CreateSalaryReportDrawer'
import { ReportFilter } from '../Filter/ReportFilter'
import { TabContent } from './TabContent'

import { type ColumnDef } from '@tanstack/react-table'

type TabId = 'innsendingar' | 'i-vinnslu' | 'afgreitt'

const IN_REVIEW = [ReportStatusEnum.IN_REVIEW]
const PROCESSED = [
  ReportStatusEnum.APPROVED,
  ReportStatusEnum.DENIED,
  ReportStatusEnum.SUPERSEDED,
]

const TAB_FIXED_STATUS: Record<
  TabId,
  typeof IN_REVIEW | typeof PROCESSED | undefined
> = {
  innsendingar: undefined,
  'i-vinnslu': IN_REVIEW,
  afgreitt: PROCESSED,
}

const STATUS_VARIANT: Record<string, TagVariant> = {
  Samþykkt: 'mint',
  Hafnað: 'red',
  Úrelt: 'dark',
  'Í vinnslu': 'blue',
  Innsent: 'rose',
  Drög: 'purple',
}

const STATUS_TO_LABEL: Record<string, string> = {
  DRAFT: 'Drög',
  SUBMITTED: 'Innsent',
  IN_REVIEW: 'Í vinnslu',
  DENIED: 'Hafnað',
  APPROVED: 'Samþykkt',
  SUPERSEDED: 'Úrelt',
}

const TYPE_TO_LABEL: Record<string, string> = {
  EQUALITY: 'Jafnréttisáætlun',
  SALARY: 'Launagreining',
}

function mapReportToCase(report: ReportListItemDto): Case {
  const reviewer = report.reviewer
    ? `${report.reviewer.firstName} ${report.reviewer.lastName}`.trim()
    : ''
  return {
    id: report.id,
    identifier: report.identifier ?? null,
    date: report.createdAt
      ? new Date(report.createdAt).toLocaleDateString('is-IS')
      : '',
    type: TYPE_TO_LABEL[report.type] ?? report.type,
    company: report.companyName ?? '',
    kennitala: report.companyNationalId ?? '',
    status: STATUS_TO_LABEL[report.status] ?? report.status,
    reviewer,
    correctionDeadline: report.correctionDeadline
      ? new Date(report.correctionDeadline).toLocaleDateString('is-IS')
      : null,
    validUntil: report.validUntil
      ? new Date(report.validUntil).toLocaleDateString('is-IS')
      : null,
  }
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

export const TabsContainer = () => {
  const [activeTab, setActiveTab] = useState<TabId>('innsendingar')

  const fixedStatus = TAB_FIXED_STATUS[activeTab]
  const fixedQuery = fixedStatus ? { status: fixedStatus } : undefined

  const { data, isLoading, filter, setFilter, resetFilter } =
    useReports(fixedQuery)

  const handleTabChange = (tab: string) => {
    resetFilter()
    setActiveTab(tab as TabId)
  }

  const extraColumns = activeTab !== 'innsendingar' ? [statusColumn] : []
  const allColumns = [...COLUMNS, ...extraColumns]

  return (
    <GridContainer>
      <Box display="flex" justifyContent="flexEnd" marginBottom={3}>
        <Inline space={2}>
          <CreateEqualityReportDrawer />
          <CreateSalaryReportDrawer />
        </Inline>
      </Box>
      <GridRow>
        <GridColumn span={['12/12', '3/12']}>
          <ReportFilter
            q={filter.q}
            type={filter.type as string[] | null}
            status={filter.status as string[] | null}
            showStatusFilter={activeTab === 'innsendingar'}
            onQChange={(q) => setFilter({ q })}
            onTypeChange={(type) =>
              setFilter({ type: type as typeof filter.type })
            }
            onStatusChange={(status) =>
              setFilter({ status: status as typeof filter.status })
            }
            onReset={resetFilter}
          />
        </GridColumn>
        <GridColumn span={['12/12', '9/12']}>
          <Stack space={2}>
            <Inline space={1} alignY="center">
              <Text fontWeight="semiBold">{data?.paging.totalItems ?? 0}</Text>
              <Text>færslur fundust</Text>
            </Inline>
            <Tabs
              label="Mál"
              selected={activeTab}
              contentBackground="blue100"
              size="sm"
              onChange={handleTabChange}
              tabs={[
                {
                  id: 'innsendingar',
                  label: `Innsendingar (${data?.statusCounts.submitted ?? 0})`,
                  content: (
                    <TabContent
                      data={data?.reports.map(mapReportToCase)}
                      isLoading={isLoading}
                      columns={allColumns}
                      expandable
                      paging={data?.paging}
                      onPageChange={(p) => setFilter({ page: p })}
                    />
                  ),
                },
                {
                  id: 'i-vinnslu',
                  label: `Í vinnslu (${data?.statusCounts.inReview ?? 0})`,
                  content: (
                    <TabContent
                      data={data?.reports.map(mapReportToCase)}
                      isLoading={isLoading}
                      columns={allColumns}
                      paging={data?.paging}
                      onPageChange={(p) => setFilter({ page: p })}
                    />
                  ),
                },
                {
                  id: 'afgreitt',
                  label: `Afgreitt (${data?.statusCounts.processed ?? 0})`,
                  content: (
                    <TabContent
                      data={data?.reports.map(mapReportToCase)}
                      isLoading={isLoading}
                      columns={allColumns}
                      paging={data?.paging}
                      onPageChange={(p) => setFilter({ page: p })}
                    />
                  ),
                },
              ]}
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
