import * as z from 'zod'

import { AdvertVersionEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getAdvertPublicationSchema = z.object({ publicationId: z.string() })

const getPublicationsSchema = z.object({
  page: z.coerce.number().int().optional(),
  pageSize: z.coerce.number().int().optional(),
  advertId: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.array(z.string()).optional(),
  typeId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
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
      const filteredInput = {
        ...input,
        advertId: input.advertId || undefined,
        search: input.search || undefined,
        categoryId: input.categoryId?.length ? input.categoryId : undefined,
        typeId: input.typeId || undefined,
      }

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
      const filteredInput = {
        ...input,
        advertId: input.advertId || undefined,
        search: input.search || undefined,
        categoryId: input.categoryId?.length ? input.categoryId : undefined,
        typeId: input.typeId || undefined,
      }

      return await ctx.api.getCombinedHTML(filteredInput)
    }),
})
