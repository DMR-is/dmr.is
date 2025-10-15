import { notFound } from 'next/navigation'

import { ApplicationFormContainer } from '../../../../../../containers/ApplicationFormContainer'
import { ALLOWED_FORM_TYPES, FormTypes } from '../../../../../../lib/constants'
import { getTrpcServer } from '../../../../../../lib/trpc/server/server'

import { TRPCError } from '@trpc/server'

function getStatusFromError(error: TRPCError): number | null {
  const cause = (error.cause ?? {}) as any

  // Check if it's the Response object directly
  if (cause && typeof cause.status === 'number') {
    return cause.status
  }

  // Check for Response internals symbol
  const responseInternals =
    (cause && cause[Symbol.for('Response internals')]) ||
    (cause &&
      Object.getOwnPropertySymbols(cause).find((symbol) =>
        symbol.toString().includes('Response internals'),
      ))

  if (responseInternals && cause[responseInternals]) {
    return cause[responseInternals].status
  }

  // Try to find status in any symbol property
  if (cause && typeof cause === 'object') {
    const symbols = Object.getOwnPropertySymbols(cause)
    for (const symbol of symbols) {
      const value = cause[symbol]
      if (value && typeof value.status === 'number') {
        return value.status
      }
    }
  }

  return null
}

export default async function UmsoknirThrotabusPage({
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
      const status = getStatusFromError(error)

      if (status === 404) {
        notFound()
      }
    }

    throw new Error('Eitthvað fór úrskeiðis við að sækja umsóknina')
  }
}
