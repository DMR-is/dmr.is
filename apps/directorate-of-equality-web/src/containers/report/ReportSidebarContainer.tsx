import { EmployeeSelect } from '../../components/EmployeeSelect'
import { ReportFormStepper } from '../../components/report/ReportFormStepper'
import { ReportSidebar } from '../../components/report/ReportSidebar'

type ReportContainerProps = {
  id: string
}

export function ReportSidebarContainer({ id }: ReportContainerProps) {
  return (
    <ReportSidebar>
      <EmployeeSelect id={id} />
      <ReportFormStepper id={id} />
    </ReportSidebar>
  )
}
