'use client'

import { useSuspenseQuery } from '@tanstack/react-query'

import { EmployeeSelect } from '../../components/report/report-sidebar/EmployeeSelect'
import { ReportFormStepper } from '../../components/report/report-sidebar/ReportFormStepper'
import { ReportSidebar } from '../../components/report/report-sidebar/ReportSidebar'
import { ReportStatusSelect } from '../../components/report/report-sidebar/ReportStatusSelect'
import { useTRPC } from '../../lib/trpc/client/trpc'

type ReportContainerProps = {
  id: string
}

export function ReportSidebarContainer({ id }: ReportContainerProps) {
  const trpc = useTRPC()
  const { data: report } = useSuspenseQuery(trpc.reports.getById.queryOptions({ id }))

  return (
    <ReportSidebar>
      <EmployeeSelect />
      <ReportStatusSelect reportId={id} status={report.status} />
      <ReportFormStepper status={report.status} />
    </ReportSidebar>
  )
}
