import { ChangeStatusButtons } from '../../components/buttons/ChangeStatusButtons'
import { EmployeeSelect } from '../../components/employee-select/EmployeeSelect'
import { AdvertFormStepper } from '../../components/Form/AdvertFormStepper'
import { AdvertSidebar } from '../../components/Form/FormSidebar'
import { AdvertPublicationModalContainer } from './AdvertPublicationModalContainer'

type AdvertContainerProps = {
  advertId: string
}

export function AdvertSidebarContainer({ advertId }: AdvertContainerProps) {
  return (
    <AdvertSidebar>
      <EmployeeSelect advertId={advertId} />
      <ChangeStatusButtons
        advertId={advertId}
        previewSlot={<AdvertPublicationModalContainer advertId={advertId} />}
      />

      <AdvertFormStepper id={advertId} />
    </AdvertSidebar>
  )
}
