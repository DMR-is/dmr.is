import { z } from 'zod'

import {
  zCommunicationStatusEnum,
  zCompanySectorEnum,
  zCompanySizeEnum,
  zEqualityCoverageSourceEnum,
  zGetReportByIdPath,
  zGetReportOutlierGroupsPath,
  zGetReportOutliersPath,
  zGetReportOutliersQuery,
  zListReportsForCompanyPath,
  zListReportsForCompanyQuery,
  zListReportsQuery,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/**
 * The generated list query plus the dimensions the export screen filters on.
 *
 * ⚠️ These are hand-written because `clientConfig.json` has not been refreshed
 * against the API since they were added — the schema is regenerated from a
 * running API, not from the DTOs. They are NOT invented: each one exists on
 * `GetReportsQueryDto` today. When the client is next regenerated
 * (`nx run directorate-of-equality-web:update-client`) this whole `.extend`
 * becomes redundant and should be deleted rather than left to drift.
 *
 * ⚠️ An input key this schema does not name is STRIPPED, silently — the filter
 * would appear to do nothing, with no error anywhere. Same trap as the
 * hand-written company schema; see the warning in `companyRouter.ts`.
 */
const zExportReportsQuery = zListReportsQuery.extend({
  employeeCountCategory: z.array(zCompanySizeEnum).optional(),
  sector: z.array(zCompanySectorEnum).optional(),
  isatCategoryCode: z.array(z.string()).optional(),
  isatSection: z.array(z.string()).optional(),
  regionCode: z.array(z.string()).optional(),
  postcode: z.array(z.string()).optional(),
  // The month the pay figures describe. Salary reports only — an equality plan
  // has no period, so any bound here excludes them.
  salaryDataPeriodFrom: z.iso.datetime().optional(),
  salaryDataPeriodTo: z.iso.datetime().optional(),
  communicationStatus: z.array(zCommunicationStatusEnum).optional(),
  equalitySource: z.array(zEqualityCoverageSourceEnum).optional(),
})

export const reportsRouter = router({
  list: protectedProcedure
    .input(zExportReportsQuery.optional())
    .query(({ ctx, input }) => {
      const query = input ? input : undefined

      return ctx.api.listReports({ query: query as never })
    }),

  listForCompany: protectedProcedure
    .input(zListReportsForCompanyPath.merge(zListReportsForCompanyQuery))
    .query(({ ctx, input }) => {
      const { companyId, page, pageSize } = input
      return ctx.api.listReportsForCompany({
        path: { companyId },
        query: { page, pageSize },
      })
    }),

  getById: protectedProcedure
    .input(zGetReportByIdPath)
    .query(({ ctx, input }) =>
      ctx.api.getReportById({
        path: { id: input.id },
      }),
    ),

  getOutliers: protectedProcedure
    .input(zGetReportOutliersPath.merge(zGetReportOutliersQuery))
    .query(({ ctx, input }) => {
      const { id, page, pageSize, sortBy, direction, groupId } = input
      return ctx.api.getReportOutliers({
        path: { id },
        query: { page, pageSize, sortBy, direction, groupId },
      })
    }),

  getOutlierGroups: protectedProcedure
    .input(zGetReportOutlierGroupsPath)
    .query(({ ctx, input }) =>
      ctx.api.getReportOutlierGroups({
        path: { id: input.id },
      }),
    ),

  overview: protectedProcedure.query(({ ctx }) => ctx.api.getReportOverview()),

  overviewStatistics: protectedProcedure.query(({ ctx }) =>
    ctx.api.getReportOverviewStatistics(),
  ),
})
