import { ApplicationFormContainer } from '../../../../../../containers/ApplicationFormContainer'
import { ALLOWED_FORM_TYPES, FormTypes } from '../../../../../../lib/constants'
import { getTrpcServer } from '../../../../../../lib/trpc/server/server'

export default async function UmsoknirThrotabusPage({
  params,
}: {
  params: { id: string; type: FormTypes }
}) {
  if (!ALLOWED_FORM_TYPES.includes(params.type)) {
    throw new Error('Tegund umsóknar finnst ekki')
  }

  const { trpc, HydrateClient } = await getTrpcServer()

  void trpc.applicationApi.getApplicationById.prefetch({ id: params.id })
  void trpc.applicationApi.getBaseEntities.prefetch()

  return (
    <HydrateClient>
      <ApplicationFormContainer id={params.id} />
    </HydrateClient>
  )
}
