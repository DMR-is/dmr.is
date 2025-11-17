import z from 'zod'

import { AdvertVersionEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getAdvertPublicationSchema = z.object({
  advertId: z.uuid(),
  version: z.enum(AdvertVersionEnum),
})

const getPublicationsSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  advertId: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.array(z.string()).optional(),
  typeId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export const publicationRouter = router({
  getPublication: protectedProcedure
    .input(getAdvertPublicationSchema)
    .query(async ({ input, ctx }) => {
      return await ctx.api.getAdvertPublication(input)
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
    .input(z.object({ advertId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.api.getPublications({
        advertId: input.advertId,
        pageSize: 5,
      })
    }),
})
