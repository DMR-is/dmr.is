import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const institutionsRouter = router({
  getInstitutions: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getInstitutions(input)
    }),

  getInstitution: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getInstitution({ id: input.id })
    }),

  createInstitution: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        nationalId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.createInstitution({
        createInstitution: input,
      })
    }),

  updateInstitution: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        nationalId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      return ctx.api.updateInstitution({
        id,
        updateInstitution: updateData,
      })
    }),

  deleteInstitution: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteInstitution({ id: input.id })
    }),
})
