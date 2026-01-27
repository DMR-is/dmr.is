import Kennitala from 'kennitala'
import z from 'zod'

import { protectedProcedure, router } from '../trpc'

import { TRPCError } from '@trpc/server'

const getEntityByNationalIdInputSchema = z.object({
  nationalId: z
    .string()
    .min(10, 'National ID must be 10 characters')
    .max(10, 'National ID must be 10 characters'),
})

export const nationalRegistryRouter = router({
  getLegalEntityNameByNationalId: protectedProcedure
    .input(getEntityByNationalIdInputSchema)
    .mutation(async ({ input, ctx }): Promise<string> => {
      const { nationalId } = input

      if (!Kennitala.isValid(nationalId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid national ID format',
        })
      }

      const entity = await ctx.api.getEntityByNationalId({ nationalId })

      if (!entity.entity) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entity not found' })
      }

      return entity.entity.nafn
    }),
  getEntityByNationalId: protectedProcedure
    .input(getEntityByNationalIdInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { nationalId } = input

      const person = await ctx.api.getEntityByNationalId({ nationalId })

      return person
    }),
})
