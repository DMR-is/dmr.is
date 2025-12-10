'use client'

import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { CommonForm } from '../components/form/common/CommonForm'
import { RecallForm } from '../components/form/recall/RecallForm'
import { ApplicationDetailedDto, ApplicationStatusEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'
import { ApplicationSubmittedContainer } from './ApplicationSubmittedContainer'

import { useSuspenseQuery } from '@tanstack/react-query'

type Props = {
  application: ApplicationDetailedDto
  type: ApplicationTypeEnum
}

export function ApplicationFormContainer({
  application: initalApplication,
  type,
}: Props) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(
    trpc.getApplicationById.queryOptions({ id: initalApplication.id }),
  )

  const { data: baseEntities } = useSuspenseQuery(
    trpc.getBaseEntities.queryOptions(),
  )

  if (data.status !== ApplicationStatusEnum.DRAFT) {
    return <ApplicationSubmittedContainer application={data} />
  }

  let Component = (
    <AlertMessage
      type="error"
      title="Tegund umsóknar finnst ekki"
      message="Athugaðu hvort tegund umsóknar sé rétt í slóðinni"
    />
  )

  switch (type) {
    case ApplicationTypeEnum.COMMON: {
      Component = (
        <CommonForm
          metadata={{
            type: data.type as unknown as ApplicationTypeEnum,
            applicationId: data.id,
            caseId: data.caseId,
            typeOptions: baseEntities.types.map((type) => ({
              label: type.title,
              value: type,
            })),
          }}
          application={{
            type: ApplicationTypeEnum.COMMON,
            ...data.answers,
          }}
        />
      )

      break
    }
    case ApplicationTypeEnum.RECALL_BANKRUPTCY: {
      Component = (
        <RecallForm
          metadata={{
            applicationId: data.id,
            caseId: data.caseId,
            type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
            courtOptions: baseEntities.courtDistricts.map((court) => ({
              label: court.title,
              value: court.id,
            })),
          }}
          application={{
            type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
            ...data.answers,
          }}
        />
      )

      break
    }
    case ApplicationTypeEnum.RECALL_DECEASED: {
      Component = (
        <RecallForm
          metadata={{
            applicationId: data.id,
            caseId: data.caseId,
            type: ApplicationTypeEnum.RECALL_DECEASED,
            courtOptions: baseEntities.courtDistricts.map((court) => ({
              label: court.title,
              value: court.id,
            })),
          }}
          application={{
            type: ApplicationTypeEnum.RECALL_DECEASED,
            ...data.answers,
          }}
        />
      )

      break
    }
  }

  return Component
}
