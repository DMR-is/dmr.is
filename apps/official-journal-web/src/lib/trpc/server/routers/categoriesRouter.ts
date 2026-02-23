import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const categoriesRouter = router({
  getCategories: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        ids: z.array(z.string()).optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getCategories(input)
    }),

  createCategory: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        slug: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createCategory({
        createCategory: input,
      })
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        slug: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      await ctx.api.updateCategory({
        id,
        updateCategory: updateData,
      })
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteCategory({ id: input.id })
    }),

  mergeCategories: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.mergeCategories({
        mergeCategoriesBody: input,
      })
    }),
})
