import { EmployeeSelect } from '../../components/report/report-sidebar/EmployeeSelect'
import { ReportFormStepper } from '../../components/report/report-sidebar/ReportFormStepper'
import { ReportSidebar } from '../../components/report/report-sidebar/ReportSidebar'
import { ReportStatusSelect } from '../../components/report/report-sidebar/ReportStatusSelect'
import { ReportStatusEnum } from '../../gen/fetch'

type ReportContainerProps = {
  id: string
  status: ReportStatusEnum
}

export function ReportSidebarContainer({ id, status }: ReportContainerProps) {
  return (
    <ReportSidebar>
      <EmployeeSelect />
      <ReportStatusSelect reportId={id} status={status} />
      <ReportFormStepper status={status} />
    </ReportSidebar>
  )
}
