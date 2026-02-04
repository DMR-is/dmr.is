import * as z from 'zod'

import { AdvertVersionEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getAdvertPublicationSchema = z.object({
  publicationId: z.uuid(),
  version: z.enum(AdvertVersionEnum),
})
const getAdvertPublicationSchema = z.object({ publicationId: z.string() })

const getPublicationsSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  advertId: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.array(z.string()).optional(),
  typeId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  version: z.enum(AdvertVersionEnum).optional(),
})

const publicationNumberAndVersionInput = z.object({
  publicationNumber: z.string(),
  version: z.enum(AdvertVersionEnum),
})

export const publicationRouter = router({
  getPublicationById: protectedProcedure
    .input(getAdvertPublicationSchema)
    .query(async ({ input, ctx }) => {
      return await ctx.api.getAdvertPublication({
        publicationId: input.publicationId,
      })
    }),
  getPublicationByNumberAndVersion: protectedProcedure
    .input(publicationNumberAndVersionInput)
    .query(async ({ input, ctx }) => {
      return await ctx.api.getPublicationByNumberAndVersion({
        publicationNumber: input.publicationNumber,
        version: input.version,
      })
    }),

  getPublications: protectedProcedure
    .input(getPublicationsSchema)
    .query(async ({ input, ctx }) => {
      const filteredInput = Object.fromEntries(
        Object.entries(input).filter(
          ([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== '' &&
            (!Array.isArray(value) || value.length > 0),
        ),
      )

      return await ctx.api.getPublications(filteredInput)
    }),
  getRelatedPublications: protectedProcedure
    .input(publicationNumberAndVersionInput)
    .query(async ({ input, ctx }) => {
      return await ctx.api.getRelatedPublications({
        publicationNumber: input.publicationNumber,
        version: input.version,
      })
    }),
  getCombinedHTML: protectedProcedure
    .input(getPublicationsSchema)
    .query(async ({ input, ctx }) => {
      const filteredInput = Object.fromEntries(
        Object.entries(input).filter(
          ([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== '' &&
            (!Array.isArray(value) || value.length > 0),
        ),
      )

      return await ctx.api.getCombinedHTML(filteredInput)
    }),
})
