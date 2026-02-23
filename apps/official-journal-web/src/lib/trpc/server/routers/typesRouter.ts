import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const typesRouter = router({
  getTypes: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        unassigned: z.boolean().optional(),
        mainType: z.string().optional(),
        search: z.string().optional(),
        slug: z.string().optional(),
        department: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getTypes(input)
    }),

  getType: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getTypeById({ id: input.id })
    }),

  createType: protectedProcedure
    .input(
      z.object({
        departmentId: z.string(),
        mainTypeId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.createType({
        createAdvertTypeBody: input,
      })
    }),

  updateType: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        mainTypeId: z.string().nullable(),
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      return ctx.api.updateType({
        id,
        updateAdvertTypeBody: updateData,
      })
    }),

  deleteType: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteType({ id: input.id })
    }),

  getMainTypes: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        unassigned: z.boolean().optional(),
        mainType: z.string().optional(),
        search: z.string().optional(),
        slug: z.string().optional(),
        department: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getMainTypes(input)
    }),

  getMainType: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getMainTypeById({ id: input.id })
    }),

  createMainType: protectedProcedure
    .input(
      z.object({
        departmentId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.createMainType({
        createAdvertMainTypeBody: input,
      })
    }),

  updateMainType: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.updateMainType({
        id: input.id,
        updateAdvertMainType: {
          title: input.title,
        },
      })
    }),

  deleteMainType: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteMainType({ id: input.id })
    }),
})
