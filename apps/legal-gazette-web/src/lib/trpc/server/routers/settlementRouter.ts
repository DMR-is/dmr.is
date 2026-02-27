import * as z from 'zod'

import {
  ApplicationRequirementStatementEnum,
  SettlementType,
} from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const updateSettlementSchema = z.object({
  id: z.string(),
  liquidatorName: z.string().optional(),
  liquidatorLocation: z.string().optional(),
  settlementName: z.string().optional(),
  settlementNationalId: z.string().optional(),
  settlementAddress: z.string().optional(),
  declaredClaims: z.number().optional(),
  settlementDeadline: z.coerce.date().nullable().optional(),
  settlementDateOfDeath: z.coerce.date().nullable().optional(),
  liquidatorRecallStatementLocation: z.string().optional(),
  liquidatorRecallStatementType: z
    .enum(ApplicationRequirementStatementEnum)
    .optional(),
  type: z.enum(SettlementType).optional(),
})

export const settlementRouter = router({
  updateSettlementSchema: protectedProcedure
    .input(updateSettlementSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateSettlementDto } = input
      return await ctx.api.updateSettlement({
        id,
        updateSettlementDto: {
          address: updateSettlementDto.settlementAddress,
          name: updateSettlementDto.settlementName,
          nationalId: updateSettlementDto.settlementNationalId,
          liquidatorLocation: updateSettlementDto.liquidatorLocation,
          liquidatorName: updateSettlementDto.liquidatorName,
          declaredClaims: updateSettlementDto.declaredClaims,
          deadline: updateSettlementDto.settlementDeadline,
          dateOfDeath: updateSettlementDto.settlementDateOfDeath,
          liquidatorRecallStatementLocation:
            updateSettlementDto.liquidatorRecallStatementLocation,
          liquidatorRecallStatementType:
            updateSettlementDto.liquidatorRecallStatementType,
          type: updateSettlementDto.type,
        },
      })
    }),
})
