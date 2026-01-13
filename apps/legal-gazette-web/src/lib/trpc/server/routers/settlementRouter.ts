import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const updateSettlementSchema = z.object({
  id: z.string(),
  liquidatorName: z.string().optional(),
  liquidatorLocation: z.string().optional(),
  settlementName: z.string().optional(),
  settlementNationalId: z.string().optional(),
  settlementAddress: z.string().optional(),
  declaredClaims: z.number().optional(),
  settlementDeadline: z.iso.datetime().nullable().optional(),
  settlementDateOfDeath: z.iso.datetime().nullable().optional(),
})

export const settlementRouter = router({
  updateSettlementSchema: protectedProcedure
    .input(updateSettlementSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateSettlementDto } = input
      return await ctx.api.updateSettlement({
        id,
        updateSettlementDto: updateSettlementDto,
      })
    }),
})
