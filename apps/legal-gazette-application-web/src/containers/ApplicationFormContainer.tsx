import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { CommonForm } from '../components/form/common/CommonForm'
import { RecallForm } from '../components/form/recall/RecallForm'
import { ApplicationStatusEnum } from '../gen/fetch'
import { trpc } from '../lib/trpc/client/server'
import { ApplicationSubmittedContainer } from './ApplicationSubmittedContainer'

type Props = {
  applicationId: string
  type: ApplicationTypeEnum
}

export async function ApplicationFormContainer({ applicationId, type }: Props) {
  const application = await fetchQueryWithHandler(
    trpc.getApplicationById.queryOptions({
      id: applicationId,
    }),
  )
  const baseEntities = await fetchQueryWithHandler(
    trpc.getBaseEntities.queryOptions(),
  )

  if (application.status !== ApplicationStatusEnum.DRAFT) {
    return <ApplicationSubmittedContainer application={application} />
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
      const application = await fetchQueryWithHandler(
        trpc.getCommonApplicationById.queryOptions({
          id: applicationId,
        }),
      )

      if (application.status === ApplicationStatusEnum.DRAFT) {
        console.log('application', {
          type: ApplicationTypeEnum.COMMON,
          answers: { ...application.answers },
        })
        Component = (
          <CommonForm
            metadata={{
              type: application.type as unknown as ApplicationTypeEnum,
              applicationId: application.id,
              caseId: application.caseId,
              typeOptions: baseEntities.types.map((type) => ({
                label: type.title,
                value: type.id,
              })),
            }}
            application={{
              type: ApplicationTypeEnum.COMMON,
              ...application.answers,
            }}
          />
        )
      }

      break
    }
    case ApplicationTypeEnum.RECALL_BANKRUPTCY: {
      const application = await fetchQueryWithHandler(
        trpc.getRecallBankruptcyApplicationById.queryOptions({
          id: applicationId,
        }),
      )

      if (application.status === ApplicationStatusEnum.DRAFT) {
        Component = (
          <RecallForm
            metadata={{
              applicationId: application.id,
              caseId: application.caseId,
              type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
              courtOptions: baseEntities.courtDistricts.map((court) => ({
                label: court.title,
                value: court.id,
              })),
            }}
            application={{
              type: ApplicationTypeEnum.RECALL_BANKRUPTCY,
              ...application.answers,
            }}
          />
        )
      }

      break
    }
    case ApplicationTypeEnum.RECALL_DECEASED: {
      const application = await fetchQueryWithHandler(
        trpc.getRecallDeceasedApplicationById.queryOptions({
          id: applicationId,
        }),
      )

      if (application.status === ApplicationStatusEnum.DRAFT) {
        Component = (
          <RecallForm
            metadata={{
              applicationId: application.id,
              caseId: application.caseId,
              type: ApplicationTypeEnum.RECALL_DECEASED,
              courtOptions: baseEntities.courtDistricts.map((court) => ({
                label: court.title,
                value: court.id,
              })),
            }}
            application={{
              type: ApplicationTypeEnum.RECALL_DECEASED,
              ...application.answers,
            }}
          />
        )
      }

      break
    }
  }

  return Component
}
