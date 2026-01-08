import z from 'zod'

import { createUserInput, updateUserInput } from '../../../inputs'
import { protectedProcedure, router } from '../trpc'

export const pagingInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
})

export const usersRouter = router({
  getEmployees: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getEmployees()
  }),
  getUsers: protectedProcedure
    .input(pagingInput)
    .query(async ({ ctx, input }) => {
      return ctx.api.getUsers(input)
    }),
  createUser: protectedProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) =>
      ctx.api.createUser({
        createUserDto: input,
      }),
    ),
  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) =>
      ctx.api.deleteUser({ userId: input.id }),
    ),
  updateUser: protectedProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) =>
      ctx.api.updateUser({
        userId: input.userId,
        updateUserDto: input,
      }),
    ),
})
