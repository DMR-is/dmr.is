'use client'

import { EmployeeSelect } from '../../components/report/report-sidebar/EmployeeSelect'
import { ReportFormStepper } from '../../components/report/report-sidebar/ReportFormStepper'
import { ReportSidebar } from '../../components/report/report-sidebar/ReportSidebar'
import { ReportStatusSelect } from '../../components/report/report-sidebar/ReportStatusSelect'
import { ReportDetailDto } from '../../gen/fetch'

type ReportSidebarContainerProps = {
  report: ReportDetailDto
}

export function ReportSidebarContainer({
  report,
}: ReportSidebarContainerProps) {
  return (
    <ReportSidebar>
      <EmployeeSelect />
      <ReportStatusSelect reportId={report.id} status={report.status} />
      <ReportFormStepper status={report.status} />
    </ReportSidebar>
  )
}
