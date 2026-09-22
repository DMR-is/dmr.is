import { protectedProcedure, router } from './trpc'

// Minimal stub router. It exists only to prove the auth -> tRPC -> API pipe
// works end to end; real key-management procedures land in a later phase.
export const appRouter = router({
  getCompanyIdentity: protectedProcedure.query(({ ctx }) => {
    return {
      companyNationalId: ctx.companyNationalId ?? null,
      actor: ctx.actor ?? null,
    }
  }),
})

// export type definition of API
export type AppRouter = typeof appRouter
