import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getEntityByNationalIdInputSchema = z.object({
  nationalId: z
    .string()
    .min(10, 'National ID must be 10 characters')
    .max(10, 'National ID must be 10 characters'),
})

export const nationalRegistryRouter = router({
  getEntityByNationalId: protectedProcedure
    .input(getEntityByNationalIdInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { nationalId } = input

      const entity = await ctx.api.getEntityByNationalId({ nationalId })

      return entity
    }),
})
