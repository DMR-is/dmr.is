import type { AppRouter } from '../server/routers/_app'

import { createTRPCContext } from '@trpc/tanstack-react-query'
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()
