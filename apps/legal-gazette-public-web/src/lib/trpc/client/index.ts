import { AppRouter } from '../server/routers/_app'

import { createTRPCReact, TRPCClientError } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()

export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError
}
