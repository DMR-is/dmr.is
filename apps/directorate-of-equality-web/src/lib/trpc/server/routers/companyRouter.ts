import { z } from 'zod'

import {
  zCreateCompanyBody,
  zRskLookupCompanyPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

const zGetCompaniesQuery = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).optional(),
  q: z.string().optional(),
  minEmployeeCount: z.number().min(0).optional(),
  sortBy: z.enum(['name', 'employeeCount']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export const companyRouter = router({
  list: protectedProcedure
    .input(zGetCompaniesQuery.optional())
    .query(({ ctx, input }) =>
      ctx.api.getCompanies({ query: input as never }),
    ),

  rskLookup: protectedProcedure
    .input(zRskLookupCompanyPath)
    .query(({ ctx, input }) =>
      ctx.api.rskLookupCompany({ path: { nationalId: input.nationalId } }),
    ),

  create: protectedProcedure
    .input(zCreateCompanyBody)
    .mutation(({ ctx, input }) =>
      ctx.api.createCompany({ body: input }),
    ),
})
