import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const userRouter = router({
  getMyUser: protectedProcedure.query(({ ctx }) => ctx.api.getMyUser()),
  list: protectedProcedure
    .input(z.object({ showInactive: z.boolean().optional() }).optional())
    .query(({ ctx, input }) =>
      ctx.api.getUsers({ query: { showInactive: input?.showInactive } }),
    ),
  create: protectedProcedure
    .input(
      z.object({
        nationalId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        role: z.enum(['ADMIN', 'EDITOR']),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.createUser({
        body: {
          nationalId: input.nationalId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          role: input.role,
        },
      }),
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.deleteUser({ path: { id: input.id } }),
    ),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        isActive: z.boolean().optional(),
        role: z.enum(['ADMIN', 'EDITOR']).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.updateUser({
        path: { id: input.id },
        body: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          isActive: input.isActive,
          role: input.role,
        },
      }),
    ),
})
