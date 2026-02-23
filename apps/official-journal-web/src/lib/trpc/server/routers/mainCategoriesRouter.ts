import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const mainCategoriesRouter = router({
  getMainCategories: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getMainCategories(input)
    }),

  createMainCategory: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        departmentId: z.string(),
        categories: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createMainCategory({
        createMainCategory: input,
      })
    }),

  updateMainCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        departmentId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      await ctx.api.updateMainCategory({
        id,
        updateMainCategory: updateData,
      })
    }),

  deleteMainCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteMainCategory({ id: input.id })
    }),

  createCategoryInMainCategory: protectedProcedure
    .input(
      z.object({
        mainCategoryId: z.string(),
        categories: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.createMainCategoryCategories({
        mainCategoryId: input.mainCategoryId,
        createMainCategoryCategories: {
          categories: input.categories,
        },
      })
    }),

  deleteCategoryFromMainCategory: protectedProcedure
    .input(
      z.object({
        mainCategoryId: z.string(),
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.deleteMainCategoryCategory({
        mainCategoryId: input.mainCategoryId,
        categoryId: input.categoryId,
      })
    }),
})
