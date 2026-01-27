import { z } from 'zod'

import { TBRTransactionStatus, TBRTransactionType } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getPaymentsInput = z.object({
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(10),
  type: z.nativeEnum(TBRTransactionType).optional(),
  status: z.nativeEnum(TBRTransactionStatus).optional(),
  paid: z.boolean().optional(),
})

export const paymentsRouter = router({
  getPaymentByTransactionId: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.getPaymentByTransactionId(input)
    }),
  getPayments: protectedProcedure
    .input(getPaymentsInput)
    .query(async ({ ctx, input }) => {
      return await ctx.api.getPaymentsList({
        page: input.page,
        pageSize: input.pageSize,
        type: input.type,
        status: input.status,
        paid: input.paid,
      })
    }),

  syncPayments: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.api.syncPayments()
  }),
})
