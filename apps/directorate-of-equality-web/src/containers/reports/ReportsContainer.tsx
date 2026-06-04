'use client'

import { parseAsStringLiteral, useQueryState } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { type TagVariant } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Tooltip } from '@dmr.is/ui/components/island-is/Tooltip'
import { TableCell } from '@dmr.is/ui/components/Tables/Table'

import { CreateEqualityReportDrawer } from '../../components/reports/CreateEqualityReportDrawer'
import { CreateSalaryReportDrawer } from '../../components/reports/CreateSalaryReportDrawer'
import {
  type FilterOption,
  ReportFilter,
} from '../../components/reports/filter/ReportFilter'
import { TabContent } from '../../components/reports/tabs/TabContent'
import {
  type ReportListItemDto,
  ReportStatusEnum,
} from '../../gen/fetch/types.gen'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useReports } from '../../hooks/useReports'
import {
  Case,
  COLUMN_REVIEWER,
  COLUMN_STATUS,
  COLUMNS,
} from '../../lib/constants'
import { overviewText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'

import { type ColumnDef } from '@tanstack/react-table'

type TabId = 'innsendingar' | 'i-vinnslu' | 'afgreitt'

const SUBMITTED = [ReportStatusEnum.SUBMITTED, ReportStatusEnum.POSTPONED]
const IN_REVIEW = [ReportStatusEnum.IN_REVIEW]
const PROCESSED = [
  ReportStatusEnum.APPROVED,
  ReportStatusEnum.DENIED,
  ReportStatusEnum.SUPERSEDED,
]

const TAB_FIXED_STATUS: Record<
  TabId,
  typeof SUBMITTED | typeof IN_REVIEW | typeof PROCESSED | undefined
> = {
  innsendingar: SUBMITTED,
  'i-vinnslu': IN_REVIEW,
  afgreitt: PROCESSED,
}

const ALL_STATUS_OPTIONS: FilterOption[] = (
  [
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'APPROVED',
    'DENIED',
    'POSTPONED',
    'SUPERSEDED',
  ] as const
).map((value) => ({ value, label: sharedText.statusLabels[value] }))

const EXCLUDED_FROM_STATUS_FILTER: Record<TabId, string[]> = {
  innsendingar: ALL_STATUS_OPTIONS.map((o) => o.value),
  'i-vinnslu': ALL_STATUS_OPTIONS.map((o) => o.value),
  // tab 3 shows ONLY the three processed statuses — exclude everything else
  afgreitt: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'POSTPONED'],
}

const STATUS_VARIANT: Record<string, TagVariant> = {
  Samþykkt: 'mint',
  Hafnað: 'red',
  Úrelt: 'dark',
  'Í vinnslu': 'blue',
  Innsent: 'rose',
  Drög: 'purple',
}

const unknown = sharedText.unknown

function mapReportToCase(report: ReportListItemDto): Case {
  const reviewer = report.reviewer
    ? `${report.reviewer.firstName} ${report.reviewer.lastName}`.trim()
    : unknown
  return {
    id: report.id,
    date: report.createdAt
      ? new Date(report.createdAt).toLocaleDateString('is-IS')
      : '',
    type: report.includesImprovementPlan
      ? 'Úrbótaáætlun'
      : (sharedText.typeLabels[
          report.type as keyof typeof sharedText.typeLabels
        ] ?? report.type),
    company: report.companyName ?? unknown,
    kennitala: formatNationalId(report.companyNationalId ?? unknown),
    status:
      sharedText.statusLabels[
        report.status as keyof typeof sharedText.statusLabels
      ] ?? report.status,
    reviewer,
    companyAdmin: report.companyAdminName ?? unknown,
    companyAdminGender: report.companyAdminGender ?? unknown,
    email: report.companyAdminEmail ?? unknown,
    isatCode: report.companyIsatCategory ?? unknown,
    employeeCount: report.companyEmployeeCountCategory ?? unknown,
  }
}

const commentsColumn: ColumnDef<Case> = {
  id: 'comments',
  header: () => null,
  size: 56,
  enableSorting: false,
  cell: ({ row }) => {
    // TODO: replace with real comments when available from backend
    const comment = overviewText.noComments
    return (
      <Box display="flex" justifyContent="center" alignItems="center">
        <Tooltip
          text={comment}
          placement="right"
          color="blue400"
          iconSize="medium"
        />
      </Box>
    )
  },
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

export const ReportsContainer = () => {
  const trpc = useTRPC()
  const { isMobile } = useIsMobile()
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral([
      'innsendingar',
      'i-vinnslu',
      'afgreitt',
    ] as const).withDefault('innsendingar'),
  )

  const fixedStatus = TAB_FIXED_STATUS[activeTab]
  const fixedQuery = fixedStatus ? { status: fixedStatus } : undefined

  const { data, isLoading, filter, setFilter, resetFilter } =
    useReports(fixedQuery)

  // Unfiltered so tab counts stay stable while user filters within a tab.
  const { data: totalCountsData } = useQuery(
    trpc.reports.list.queryOptions(
      {},
      { staleTime: 30_000, placeholderData: (prev) => prev },
    ),
  )

  const needsUsers = activeTab !== 'innsendingar'
  const { data: usersData } = useQuery(
    trpc.user.list.queryOptions(undefined, { enabled: needsUsers }),
  )

  const reviewerOptions: FilterOption[] = (usersData ?? []).map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`.trim(),
  }))

  const excluded = EXCLUDED_FROM_STATUS_FILTER[activeTab]
  const statusOptions = ALL_STATUS_OPTIONS.filter(
    (o) => !excluded.includes(o.value),
  )

  const handleTabChange = (tab: string) => {
    resetFilter()
    setActiveTab(tab as TabId)
  }

  const leadingColumns: ColumnDef<Case>[] =
    activeTab === 'i-vinnslu' ? [commentsColumn] : []
  const middleColumns: ColumnDef<Case>[] =
    activeTab === 'i-vinnslu' ? [COLUMN_REVIEWER] : []
  const trailingColumns: ColumnDef<Case>[] =
    activeTab !== 'innsendingar' ? [statusColumn] : []
  const allColumns = [
    ...leadingColumns,
    ...COLUMNS,
    ...middleColumns,
    ...trailingColumns,
  ]

  const filterAndTable = (expandable?: boolean) => (
    <Box paddingTop={[0, 0, 4]}>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
          <Stack space={3}>
            <ReportFilter
              q={filter.q}
              type={filter.type as string[] | null}
              status={filter.status as string[] | null}
              statusOptions={statusOptions}
              reviewerUserId={filter.reviewerUserId as string[] | null}
              reviewers={needsUsers ? reviewerOptions : undefined}
              hasImprovementPlan={filter.hasImprovementPlan ?? null}
              onQChange={(q) => setFilter({ q })}
              onTypeChange={(type) =>
                setFilter({ type: type as typeof filter.type })
              }
              onStatusChange={(status) =>
                setFilter({ status: status as typeof filter.status })
              }
              onReviewerChange={(reviewerUserId) =>
                setFilter({
                  reviewerUserId:
                    reviewerUserId as typeof filter.reviewerUserId,
                })
              }
              onHasImprovementPlanChange={(v) =>
                setFilter({ hasImprovementPlan: v })
              }
              onReset={resetFilter}
            />
            {!isMobile && (
              <Stack space={2}>
                <CreateEqualityReportDrawer />
                <CreateSalaryReportDrawer />
              </Stack>
            )}
          </Stack>
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
          <Box marginLeft={[0, 0, 0, 2]}>
            <Stack space={[1, 2]}>
              <Inline space={1} alignY="center">
                <Text fontWeight="semiBold" marginTop={isMobile ? 2 : 0}>
                  {data?.paging.totalItems ?? 0}
                </Text>
                <Text marginTop={isMobile ? 2 : 0}>
                  {overviewText.resultsText}
                </Text>
              </Inline>
              <TabContent
                data={data?.reports.map(mapReportToCase)}
                isLoading={isLoading}
                columns={allColumns}
                expandable={expandable}
                paging={data?.paging}
                onPageChange={(p) => setFilter({ page: p })}
              />
              {isMobile && (
                <Box marginTop={2}>
                  <Stack space={2}>
                    <CreateEqualityReportDrawer />
                    <CreateSalaryReportDrawer />
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </Box>
  )

  return (
    <GridContainer>
      <Tabs
        label="Mál"
        selected={activeTab}
        contentBackground="blue100"
        size="sm"
        onlyRenderSelectedTab
        onChange={handleTabChange}
        tabs={[
          {
            id: 'innsendingar',
            label: `${overviewText.tabInnsendingar} (${(totalCountsData?.statusCounts.submitted ?? 0) + (totalCountsData?.statusCounts.postponed ?? 0)})`,
            content: filterAndTable(true),
          },
          {
            id: 'i-vinnslu',
            label: `${overviewText.tabInProgress} (${totalCountsData?.statusCounts.inReview ?? 0})`,
            content: filterAndTable(),
          },
          {
            id: 'afgreitt',
            label: `${overviewText.tabAfgreitt} (${totalCountsData?.statusCounts.processed ?? 0})`,
            content: filterAndTable(),
          },
        ]}
      />
    </GridContainer>
  )
}
