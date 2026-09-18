import { col, Op } from 'sequelize'

import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'

/**
 * Which of the given reports carry an úrbótaáætlun — i.e. have at least one
 * employee flagged as an outlier.
 *
 * One grouped query for the whole set rather than one per report: both callers
 * hand this a page (or a whole export) of ids at once.
 *
 * Every id asked about is present in the result, `false` when it has no
 * outliers. A caller that read a missing key as "no" would be right by
 * accident; making the map total means `.get(id)` is never ambiguous between
 * "no outliers" and "not asked about".
 */
export const computeIncludesImprovementPlan = async (
  outlierModel: typeof ReportEmployeeOutlierModel,
  reportIds: string[],
): Promise<Map<string, boolean>> => {
  const result = new Map<string, boolean>()
  if (reportIds.length === 0) return result
  for (const id of reportIds) result.set(id, false)

  const rows = ((await outlierModel.findAll({
    include: [
      {
        model: ReportEmployeeModel,
        as: 'reportEmployee',
        attributes: [],
        where: { reportId: { [Op.in]: reportIds } },
        required: true,
      },
    ],
    attributes: [[col('reportEmployee.report_id'), 'reportId']],
    group: [col('reportEmployee.report_id')],
    raw: true,
  })) as unknown) as { reportId: string }[]

  for (const row of rows) result.set(row.reportId, true)
  return result
}
