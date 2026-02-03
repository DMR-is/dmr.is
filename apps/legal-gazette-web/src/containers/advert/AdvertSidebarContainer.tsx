'use client'

import { useQuery, useSuspenseQuery } from '@dmr.is/trpc/client/trpc'

import { ChangeStatusButtons } from '../../components/buttons/ChangeStatusButtons'
import { EmployeeSelect } from '../../components/employee-select/EmployeeSelect'
import { AdvertFormStepper } from '../../components/Form/AdvertFormStepper'
import { AdvertSidebar } from '../../components/Form/FormSidebar'
import { AdvertPublicationDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { AdvertPublicationModalContainer } from './AdvertPublicationModalContainer'

type AdvertContainerProps = {
  id: string
}

const findOptimalPublicationId = (
  publications: AdvertPublicationDto[],
): string => {
  // search for next publication which is not published
  for (const pub of publications) {
    if (!pub.publishedAt) {
      return pub.id
    }
  }

  // all are published, return the last one
  return publications[publications.length - 1]?.id
}

export function AdvertSidebarContainer({ id }: AdvertContainerProps) {
  const trpc = useTRPC()
  const { data: usersData, isLoading: isLoadingEmployees } = useQuery(
    trpc.getEmployees.queryOptions(),
  )
  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))
  const pubId = findOptimalPublicationId(advert.publications)

  return (
    <AdvertSidebar>
      <EmployeeSelect
        currentStatusId={advert.status.id}
        isLoading={isLoadingEmployees}
        advertId={advert.id}
        assignedUserId={advert.assignedUser?.id}
        options={usersData?.users.map((user) => ({
          label: user.name,
          value: user.id,
          disabled: !user.isActive,
        }))}
      />
      <ChangeStatusButtons
        advertId={advert.id}
        currentStatus={advert.status}
        canEdit={advert.canEdit}
        canPublish={advert.canPublish}
        previewSlot={<AdvertPublicationModalContainer pubId={pubId} />}
      />

      <AdvertFormStepper id={id} />
    </AdvertSidebar>
  )
}
