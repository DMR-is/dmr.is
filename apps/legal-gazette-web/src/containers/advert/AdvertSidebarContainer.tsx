'use client'

import { useEffect, useState } from 'react'

import { useQuery, useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { toast } from '@dmr.is/ui/components/island-is'

import { ChangeStatusButtons } from '../../components/buttons/ChangeStatusButtons'
import { EmployeeSelect } from '../../components/employee-select/EmployeeSelect'
import { AdvertFormStepper } from '../../components/Form/AdvertFormStepper'
import { AdvertSidebar } from '../../components/Form/FormSidebar'
import { AdvertPublicationModal } from '../../components/modals/AdvertPublicationModal'
import { AdvertPublicationDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

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

  const [modalVisible, setModalVisible] = useState(false)

  const {
    data: publicationData,
    error: publicationError,
    isLoading: isLoadingPublicationData,
    refetch,
  } = useQuery(trpc.getPublication.queryOptions({ id: pubId }))

  useEffect(() => {
    if (publicationError && !isLoadingPublicationData) {
      toast.error('Ekki tókst að sækja birtingu')
    }
  }, [publicationError, isLoadingPublicationData])

  const onOpenPublicationModal = (modalVisible: boolean) => {
    if (publicationData) refetch()
    setModalVisible(modalVisible)
  }

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
        setModalVisible={(modalVisible) => onOpenPublicationModal(modalVisible)}
        canPublish={advert.canPublish}
      />
      <AdvertFormStepper id={id} />
      {publicationData?.html && modalVisible && (
        <AdvertPublicationModal
          html={publicationData.html}
          isVisible={modalVisible}
          onVisibilityChange={(vis) => {
            setModalVisible(vis)
          }}
          id="advert-publication-modal"
        />
      )}
    </AdvertSidebar>
  )
}
