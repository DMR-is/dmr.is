'use client'

import { ChangeStatusButtons } from '../../components/buttons/ChangeStatusButtons'
import { EmployeeSelect } from '../../components/employee-select/EmployeeSelect'
import { AdvertFormStepper } from '../../components/Form/AdvertFormStepper'
import { AdvertSidebar } from '../../components/Form/FormSidebar'
import {
  useQuery,
  useSuspenseQuery,
  useTRPC,
} from '../../lib/trpc/client/trpc'

type AdvertContainerProps = {
  id: string
}

export function AdvertSidebarContainer({ id }: AdvertContainerProps) {
  const trpc = useTRPC()
  const { data: usersData, isLoading: isLoadingEmployees } = useQuery(
    trpc.getEmployees.queryOptions(),
  )
  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))

  return (
    <AdvertSidebar>
      <EmployeeSelect
        isLoading={isLoadingEmployees}
        advertId={advert.id}
        assignedUserId={advert.assignedUser}
        options={usersData?.users.map((user) => ({
          label: user.name,
          value: user.id,
        }))}
      />
      <ChangeStatusButtons
        advertId={advert.id}
        currentStatus={advert.status}
        canEdit={advert.canEdit}
      />
      <AdvertFormStepper id={id} />
    </AdvertSidebar>
  )
}
