'use client'

import { useEffect, useRef, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { type EmployeeCountHistoryEntryDto } from '../../../../gen/fetch'
import {
  EMPLOYEE_COUNT_HISTORY_ANCHOR,
  NAV_PATHS,
  ReportStatusTranslatedEnum,
} from '../../../../lib/constants'
import {
  companiesText,
  serverErrorText,
  sharedText,
} from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import {
  COMPANY_SIZE_LABEL,
  formatEmployeeCount,
  formatTimestampDate,
  reportTypeLabel,
} from '../../../../lib/utils'

import { type ColumnDef } from '@tanstack/react-table'

const t = companiesText.detailView.employeeCountHistory

const columns: ColumnDef<EmployeeCountHistoryEntryDto>[] = [
  {
    accessorKey: 'submittedAt',
    header: t.submittedAt,
    cell: ({ row }) => formatTimestampDate(row.original.submittedAt),
    meta: { fit: true },
  },
  {
    accessorKey: 'type',
    header: t.report,
    cell: ({ row }) => (
      <LinkV2 href={`${NAV_PATHS.heildarlisti.href}/${row.original.reportId}`}>
        <Button variant="text" size="small" unfocusable>
          {reportTypeLabel(
            row.original.type,
            row.original.includesImprovementPlan,
          )}
        </Button>
      </LinkV2>
    ),
    meta: { grow: true },
  },
  {
    accessorKey: 'status',
    header: t.status,
    cell: ({ row }) => ReportStatusTranslatedEnum[row.original.status],
    meta: { fit: true },
  },
  {
    accessorKey: 'employeeCountCategory',
    header: t.size,
    cell: ({ row }) => COMPANY_SIZE_LABEL[row.original.employeeCountCategory],
    meta: { fit: true },
  },
  {
    accessorKey: 'femaleCount',
    header: sharedText.genders.femaleCount,
    cell: ({ row }) => formatEmployeeCount(row.original.femaleCount),
    meta: { fit: true },
  },
  {
    accessorKey: 'maleCount',
    header: sharedText.genders.maleCount,
    cell: ({ row }) => formatEmployeeCount(row.original.maleCount),
    meta: { fit: true },
  },
  {
    accessorKey: 'neutralCount',
    header: t.neutral,
    cell: ({ row }) => formatEmployeeCount(row.original.neutralCount),
    meta: { fit: true },
  },
  {
    accessorKey: 'totalCount',
    header: t.total,
    cell: ({ row }) => formatEmployeeCount(row.original.totalCount),
    meta: { fit: true },
  },
]

type Props = {
  companyId: string
}

export const EmployeeCountHistory = ({ companyId }: Props) => {
  const trpc = useTRPC()
  const ref = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState(false)

  const { data, isError } = useQuery(
    trpc.reports.employeeCountHistory.queryOptions({ companyId }),
  )

  const entries = data?.entries ?? []
  const hasEntries = entries.length > 0

  // Arriving from a report's "Skoða starfsmannafjöldasögu" link: open the
  // section and bring it into view instead of leaving it collapsed. Keyed on
  // `hasEntries` because the section is not rendered until the history has
  // loaded and has rows, so there is nothing to scroll to on mount.
  useEffect(() => {
    if (!hasEntries) return
    if (window.location.hash !== `#${EMPLOYEE_COUNT_HISTORY_ANCHOR}`) return
    setExpanded(true)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hasEntries])

  // Nothing while loading and nothing when empty: a company that has never
  // declared a headcount gets no section at all rather than an empty one. A
  // failed load still shows, so an error is not mistaken for "no history".
  if (!isError && !hasEntries) return null

  return (
    <Box ref={ref} id={EMPLOYEE_COUNT_HISTORY_ANCHOR} marginTop={6}>
      <Accordion singleExpand={false} dividerOnTop={false} space={'p5'}>
        <AccordionItem
          id="company-employee-count-history"
          label={t.heading}
          expanded={expanded}
          onToggle={setExpanded}
        >
          <Box marginBottom={3}>
            <Text>{t.description}</Text>
          </Box>
          {isError ? (
            <AlertMessage
              type="error"
              title={serverErrorText.title}
              message={t.loadError}
            />
          ) : (
            <Table columns={columns} data={entries} layout="auto" />
          )}
        </AccordionItem>
      </Accordion>
    </Box>
  )
}
