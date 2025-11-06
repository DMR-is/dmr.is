import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getPersonByNationalIdInputSchema = z.object({
  nationalId: z
    .string()
    .min(10, 'National ID must be 10 characters')
    .max(10, 'National ID must be 10 characters'),
})

export const nationalRegistryRouter = router({
  getPersonByNationalId: protectedProcedure
    .input(getPersonByNationalIdInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { nationalId } = input

      const person = await ctx.api.getPersonByNationalId({ nationalId })

      return person
    }),
})
