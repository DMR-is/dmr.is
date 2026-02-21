import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const usersRouter = router({
  getUsers: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        search: z.string().optional(),
        involvedParty: z.string().optional(),
        role: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getUsers(input)
    }),

  createUser: protectedProcedure
    .input(
      z.object({
        createUserDto: z.object({
          nationalId: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          email: z.string(),
          roleId: z.string(),
          involvedParties: z.array(z.string()).optional(),
          displayName: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.createUser(input)
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        updateUserDto: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().optional(),
          roleId: z.string().optional(),
          involvedParties: z.array(z.string()).optional(),
          displayName: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.updateUser(input)
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteUser({ id: input.id })
    }),

  getRolesByUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getRolesByUser()
  }),

  getInvolvedPartiesByUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getInvolvedPartiesByUser()
  }),

  getAvailableInvolvedParties: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getCaseAvailableInvolvedParties({
        caseId: input.caseId,
      })
    }),

  updateInvolvedParty: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        involvedPartyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.updateSingleCaseInvolvedParty({
        id: input.id,
        updateCaseInvolvedPartyBody: {
          involvedPartyId: input.involvedPartyId,
        },
      })
    }),
})
