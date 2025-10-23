'use client'

import { ChangeStatusButtons } from '../../components/buttons/ChangeStatusButtons'
import { EmployeeSelect } from '../../components/employee-select/EmployeeSelect'
import { AdvertFormStepper } from '../../components/Form/AdvertFormStepper'
import { AdvertSidebar } from '../../components/Form/FormSidebar'
import { AdvertDetailedDto } from '../../gen/fetch'
import { trpc } from '../../lib/trpc/client'

type AdvertContainerProps = {
  advert: AdvertDetailedDto
}

export function AdvertSidebarContainer({ advert }: AdvertContainerProps) {
  const { data, isLoading } = trpc.users.getEmployees.useQuery()

  return (
    <AdvertSidebar>
      <EmployeeSelect
        isLoading={isLoading}
        advertId={advert.id}
        assignedUserId={advert.assignedUser}
        options={data?.users.map((user) => ({
          label: user.name,
          value: user.id,
        }))}
      />
      <ChangeStatusButtons
        advertId={advert.id}
        currentStatus={advert.status}
        canEdit={advert.canEdit}
      />
      <AdvertFormStepper advert={advert} comments={advert.comments} />
    </AdvertSidebar>
  )
}
