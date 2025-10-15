import { notFound } from 'next/navigation'

import { ApplicationFormContainer } from '../../../../../../containers/ApplicationFormContainer'
import { ALLOWED_FORM_TYPES, FormTypes } from '../../../../../../lib/constants'
import { getStatusFromTRPCError } from '../../../../../../lib/serverUtils'
import { getTrpcServer } from '../../../../../../lib/trpc/server/server'

import { TRPCError } from '@trpc/server'

export default async function ApplicationPage({
  params,
}: {
  params: { id: string; type: FormTypes }
}) {
  if (!ALLOWED_FORM_TYPES.includes(params.type)) {
    throw new Error('Tegund umsóknar finnst ekki')
  }

  const { trpc, HydrateClient } = await getTrpcServer()

  try {
    void trpc.applicationApi.getBaseEntities.prefetch()
    const data = await trpc.applicationApi.getApplicationById({
      id: params.id,
    })
    return (
      <HydrateClient>
        <ApplicationFormContainer application={data} />
      </HydrateClient>
    )
  } catch (error) {
    if (error instanceof TRPCError) {
      const status = getStatusFromTRPCError(error)

      if (status === 404) {
        notFound()
      }
    }

    throw new Error('Eitthvað fór úrskeiðis við að sækja umsóknina')
  }
}
