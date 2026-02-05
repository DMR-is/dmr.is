import { ChangeStatusButtons } from '../../components/buttons/ChangeStatusButtons'
import { EmployeeSelect } from '../../components/employee-select/EmployeeSelect'
import { AdvertFormStepper } from '../../components/Form/AdvertFormStepper'
import { AdvertSidebar } from '../../components/Form/FormSidebar'
import { AdvertPublicationModalContainer } from './AdvertPublicationModalContainer'

type AdvertContainerProps = {
  id: string
}

export function AdvertSidebarContainer({ id }: AdvertContainerProps) {
  return (
    <AdvertSidebar>
      <EmployeeSelect advertId={id} />
      <ChangeStatusButtons
        advertId={id}
        previewSlot={<AdvertPublicationModalContainer advertId={id} />}
      />

      <AdvertFormStepper id={id} />
    </AdvertSidebar>
  )
}
