import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { CommonForm } from '../../../../../../components/form/common/CommonForm'
import { ApplicationStatusEnum } from '../../../../../../gen/fetch'
import { ALLOWED_FORM_TYPES, FormTypes } from '../../../../../../lib/constants'
import { trpc } from '../../../../../../lib/trpc/client/server'

export default async function ApplicationPage({
  params,
}: {
  params: { id: string; type: FormTypes }
}) {
  if (!ALLOWED_FORM_TYPES.includes(params.type)) {
    throw new Error('Tegund umsóknar finnst ekki')
  }

  const baseEntities = await fetchQueryWithHandler(
    trpc.getBaseEntities.queryOptions(),
  )

  let Component = (
    <AlertMessage
      type="error"
      title="Tegund umsóknar finnst ekki"
      message="Athugaðu hvort tegund umsóknar sé rétt í slóðinni"
    />
  )

  switch (params.type) {
    case FormTypes.COMMON: {
      const application = await fetchQueryWithHandler(
        trpc.getCommonApplicationById.queryOptions({
          id: params.id,
        }),
      )

      if (application.status === ApplicationStatusEnum.DRAFT) {
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
            application={application.answers}
          />
        )
      }

      break
    }
    case FormTypes.BANKRUPTCY: {
      const application = await fetchQueryWithHandler(
        trpc.getRecallBankruptcyApplicationById.queryOptions({
          id: params.id,
        }),
      )

      if (application.status === ApplicationStatusEnum.DRAFT) {
        // Component = <RecallForm />
      }

      break
    }
    case FormTypes.DECEASED: {
      const application = await fetchQueryWithHandler(
        trpc.getRecallDeceasedApplicationById.queryOptions({
          id: params.id,
        }),
      )

      if (application.status === ApplicationStatusEnum.DRAFT) {
        // Component = <RecallForm />
      }

      break
    }
  }

  return Component

  // return (
  // <HydrateClient>
  //   <ApplicationFormContainer application={data} />
  // </HydrateClient>
  // )
}
