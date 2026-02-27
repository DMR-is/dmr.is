import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const createPublicationSchema = z.object({
  advertId: z.string(),
})

const updatePublicationSchema = z.object({
  advertId: z.string(),
  publicationId: z.string(),
  scheduledAt: z.coerce.date(),
})

const deletePublicationSchema = z.object({
  advertId: z.string(),
  publicationId: z.string(),
})

export const publicationsRouter = router({
  createPublication: protectedProcedure
    .input(createPublicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.createPublication({
        advertId: input.advertId,
      })
    }),

  updatePublication: protectedProcedure
    .input(updatePublicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.updatePublication({
        publicationId: input.publicationId,
        updateAdvertPublicationDto: {
          scheduledAt: input.scheduledAt,
        },
      })
    }),

  deletePublication: protectedProcedure
    .input(deletePublicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.deletePublication({
        publicationId: input.publicationId,
      })
    }),
  getPublication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.api.getAdvertPublication({ publicationId: input.id })
    }),
})
