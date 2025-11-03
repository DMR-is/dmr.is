'use client'

import { notFound } from 'next/navigation'

import { AlertMessage, SkeletonLoader } from '@dmr.is/ui/components/island-is'

import { ApplicationForm } from '../components/client-components/form/ApplicationForm'
import { ApplicationDetailedDto, ApplicationStatusEnum } from '../gen/fetch'
import { trpc } from '../lib/trpc/client'
import { ApplicationSubmittedContainer } from './ApplicationSubmittedContainer'

type Props = {
  application: ApplicationDetailedDto
}
export function ApplicationFormContainer({ application }: Props) {
  const { data, error, isLoading } =
    trpc.applicationApi.getApplicationById.useQuery(
      { id: application.id },
      { initialData: application },
    )

  const [{ courtDistricts, types }] =
    trpc.applicationApi.getBaseEntities.useSuspenseQuery()

  if (error) {
    return notFound()
  }

  if (isLoading) {
    return <SkeletonLoader height={450} borderRadius="large" />
  }

  if (!data) {
    return (
      <AlertMessage
        type="warning"
        title="Engin gögn fundust fyrir þessa umsókn"
        message="Vinsamlegast reyndu aftur síðar"
      />
    )
  }

  if (data.status === ApplicationStatusEnum.DRAFT) {
    return (
      <ApplicationForm
        application={data}
        types={types.map((type) => ({
          label: type.title,
          value: type.id,
        }))}
        courtDistricts={courtDistricts.map((cd) => ({
          label: cd.title,
          value: cd.id,
        }))}
      />
    )
  }

  return <ApplicationSubmittedContainer application={application} />
}
