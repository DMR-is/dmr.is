import { z } from 'zod'

import { trpcProcedureHandler } from '@dmr.is/trpc/utils/errorHandler'

import { protectedProcedure, router } from '../trpc'

export const legacyMigrationRouter = router({
  /**
   * Check if an email exists in the legacy subscriber system
   * Returns whether the email exists and if it has an associated kennitala
   */
  checkEmail: protectedProcedure
    .input(z.object({ email: z.email() }))
    .mutation(async ({ ctx, input }) => {
      return await trpcProcedureHandler(async () => {
        return ctx.api.checkLegacyEmail({
          checkLegacyEmailDto: { email: input.email },
        })
      })
    }),

  /**
   * Request a magic link for migration
   * Sends an email to the legacy email address with a link to complete migration
   */
  requestMigration: protectedProcedure
    .input(z.object({ email: z.email() }))
    .mutation(async ({ ctx, input }) => {
      return await trpcProcedureHandler(async () => {
        return ctx.api.requestLegacyMigration({
          requestMigrationDto: { email: input.email },
        })
      })
    }),
  /**
   * Complete the migration using the magic link token
   * Verifies the token and migrates the legacy account to the authenticated user
   */
  completeMigration: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await trpcProcedureHandler(async () => {
        return ctx.api.completeLegacyMigration({
          completeMigrationDto: { token: input.token },
        })
      })
    }),
})
