'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { AlertMessage } from '@island.is/island-ui/core'

import { EmployeeSelect } from '../../components/report/report-sidebar/EmployeeSelect'
import { ReportCommunicationControl } from '../../components/report/report-sidebar/ReportCommunicationControl'
import { ReportFormStepper } from '../../components/report/report-sidebar/ReportFormStepper'
import { ReportSidebar } from '../../components/report/report-sidebar/ReportSidebar'
import { ReportStatusSelect } from '../../components/report/report-sidebar/ReportStatusSelect'
import { ReportDetailDto, ReportStatusEnum } from '../../gen/fetch'
import { companiesText, reportText } from '../../lib/text'
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
  // Terminal statuses lock the sidebar entirely. POSTPONED only locks reviewer
  // assignment (the API rejects assigning postponed reports) — the status
  // actions stay live so a reviewer can deny a report whose postponed outliers
  // are never resolved.
  const isTerminal = data.status === 'DENIED' || data.status === 'APPROVED'
  const isDisabled = isTerminal || data.status === 'POSTPONED'

  return (
    <ReportSidebar>
      <Text variant="h5">{reportText.sidebarTitle}</Text>
      {data.companyQuarantined && (
        <Box marginTop={2}>
          <AlertMessage
            type="warning"
            title={companiesText.detailView.quarantinedAlert}
          />
        </Box>
      )}
      {data.companyFinesStarted && (
        <Box marginTop={2}>
          <AlertMessage
            type="warning"
            title={companiesText.detailView.finesAlert}
          />
        </Box>
      )}
      <EmployeeSelect
        reportId={data.id}
        assignedUserId={data.reviewer?.id}
        disabled={isDisabled}
      />
      <ReportStatusSelect
        reportId={data.id}
        status={data.status}
        disabled={isTerminal}
      />
      <Box paddingTop={1}>
        <Divider />
      </Box>
      <ReportCommunicationControl
        reportId={data.id}
        communicationStatus={data.communicationStatus}
        disabled={data.status !== ReportStatusEnum.IN_REVIEW}
      />
      <Box paddingTop={1}>
        <Divider />
      </Box>
      <ReportFormStepper status={data.status} />
    </ReportSidebar>
  )
}
