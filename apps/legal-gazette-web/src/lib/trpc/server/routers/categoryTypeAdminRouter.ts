import * as z from 'zod'

import { ChangeLogEntity } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const titleSlug = {
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
}

const moveSchema = z.object({
  fromTypeId: z.uuid(),
  fromCategoryId: z.uuid().optional(),
  toTypeId: z.uuid().optional(),
  toCategoryId: z.uuid().optional(),
})

export const categoryTypeAdminRouter = router({
  // --- Current state ---
  getCategoryTypeOverview: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getCategoryTypeOverview()
  }),

  // --- Categories ---
  createCategory: protectedProcedure
    .input(z.object(titleSlug))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.createCategory({ createCategoryBody: input })
    }),
  updateCategory: protectedProcedure
    .input(z.object({ id: z.uuid(), title: z.string().optional(), slug: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateCategoryBody } = input
      return ctx.api.updateCategory({ id, updateCategoryBody })
    }),
  setCategoryActive: protectedProcedure
    .input(z.object({ id: z.uuid(), active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.setCategoryActive({
        id: input.id,
        setActiveBody: { active: input.active },
      })
    }),
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.deleteCategory({ id: input.id })
    }),
  getCategoryImpact: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.api.getCategoryImpact({ id: input.id })
    }),

  // --- Types ---
  createType: protectedProcedure
    .input(z.object(titleSlug))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.createType({ createTypeBody: input })
    }),
  updateType: protectedProcedure
    .input(z.object({ id: z.uuid(), title: z.string().optional(), slug: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateTypeBody } = input
      return ctx.api.updateType({ id, updateTypeBody })
    }),
  setTypeActive: protectedProcedure
    .input(z.object({ id: z.uuid(), active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.setTypeActive({
        id: input.id,
        setActiveBody: { active: input.active },
      })
    }),
  deleteType: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.deleteType({ id: input.id })
    }),
  getTypeImpact: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.api.getTypeImpact({ id: input.id })
    }),

  // --- Connections ---
  attachTypeCategory: protectedProcedure
    .input(z.object({ typeId: z.uuid(), categoryId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.attachTypeCategory({ connectionBody: input })
    }),
  detachTypeCategory: protectedProcedure
    .input(z.object({ typeId: z.uuid(), categoryId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.detachTypeCategory({ connectionBody: input })
    }),

  // --- Bulk advert moves ---
  getMoveImpact: protectedProcedure
    .input(moveSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.api.getMoveImpact({ moveAdvertsBody: input })
    }),
  moveAdverts: protectedProcedure
    .input(moveSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.api.moveAdverts({ moveAdvertsBody: input })
    }),

  // --- Change log + undo ---
  getCategoryTypeChangeLog: protectedProcedure
    .input(
      z
        .object({
          entityType: z.nativeEnum(ChangeLogEntity).optional(),
          entityId: z.uuid().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      return ctx.api.getCategoryTypeChangeLog({
        entityType: input?.entityType,
        entityId: input?.entityId,
        limit: input?.limit,
        offset: input?.offset,
      })
    }),
  revertCategoryTypeChange: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.api.revertCategoryTypeChange({ id: input.id })
    }),
})
