'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { EmployeeSelect } from '../../components/report/report-sidebar/EmployeeSelect'
import { ReportFormStepper } from '../../components/report/report-sidebar/ReportFormStepper'
import { ReportSidebar } from '../../components/report/report-sidebar/ReportSidebar'
import { ReportStatusSelect } from '../../components/report/report-sidebar/ReportStatusSelect'
import { ReportDetailDto } from '../../gen/fetch'
import { reportText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

type ReportSidebarContainerProps = {
  report: ReportDetailDto
}

export function ReportSidebarContainer({
  report,
}: ReportSidebarContainerProps) {
  const trpc = useTRPC()
  const { data } = useQuery({
    ...trpc.reports.getById.queryOptions({ id: report.id }),
    initialData: report,
  })
  const isDisabled =
    data.status === 'POSTPONED' ||
    data.status === 'DENIED' ||
    data.status === 'APPROVED'

  return (
    <ReportSidebar>
      <Text variant="h5">{reportText.sidebarTitle}</Text>
      <EmployeeSelect
        reportId={data.id}
        assignedUserId={data.reviewer?.id}
        disabled={isDisabled}
      />
      <ReportStatusSelect
        reportId={data.id}
        status={data.status}
        disabled={isDisabled}
      />
      <Box paddingTop={1}>
        <Divider />
      </Box>
      <ReportFormStepper status={data.status} />
    </ReportSidebar>
  )
}
