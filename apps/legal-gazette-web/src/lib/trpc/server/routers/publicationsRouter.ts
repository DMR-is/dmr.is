import { z } from 'zod'

import { GetAdvertPublicationVersionEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const createPublicationSchema = z.object({
  advertId: z.string(),
})

const updatePublicationSchema = z.object({
  advertId: z.string(),
  publicationId: z.string(),
  scheduledAt: z.string(),
})

const deletePublicationSchema = z.object({
  advertId: z.string(),
  publicationId: z.string(),
})

const publishPublicationSchema = z.object({
  advertId: z.string(),
  publicationId: z.string(),
})

const getPublicationSchema = z.object({
  advertId: z.string(),
  version: z.nativeEnum(GetAdvertPublicationVersionEnum),
})

export const publicationsRouter = router({
  createPublication: protectedProcedure
    .input(createPublicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.publicationsApi.createAdvertPublication({
        advertId: input.advertId,
      })
    }),

  updatePublication: protectedProcedure
    .input(updatePublicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.publicationsApi.updateAdvertPublication({
        advertId: input.advertId,
        publicationId: input.publicationId,
        updateAdvertPublicationDto: {
          scheduledAt: input.scheduledAt,
        },
      })
    }),

  deletePublication: protectedProcedure
    .input(deletePublicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.publicationsApi.deleteAdvertPublication({
        advertId: input.advertId,
        publicationId: input.publicationId,
      })
    }),

  publishPublication: protectedProcedure
    .input(publishPublicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.publicationsApi.publishAdvertPublication({
        advertId: input.advertId,
        publicationId: input.publicationId,
      })
    }),

  getPublication: protectedProcedure
    .input(getPublicationSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.publicationsApi.getAdvertPublication({
        advertId: input.advertId,
        version: input.version,
      })
    }),
})
