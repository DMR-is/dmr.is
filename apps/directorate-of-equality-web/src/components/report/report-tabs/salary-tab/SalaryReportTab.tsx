import { Stack } from '@island.is/island-ui/core'

import { ReportEmployeeOutlierDto, SalaryByGenderAndScoreDto } from '../../../../gen/fetch'
import { OutlierInputForm } from './OutlierInputForm'
import { OutlierPlanTable } from './OutlierPlanTable'
import { SalaryDistributionChart } from "./SalaryDistributionChart"
import { SalaryStatistics } from "./SalaryStatistics"

interface SalaryReportTabProps {
  data: SalaryByGenderAndScoreDto
  reportId: string
  outliers: ReportEmployeeOutlierDto[]
  outlierDate?: Date
}

const formatSalary = (v: number) => new Intl.NumberFormat('is-IS').format(Math.round(v)).replaceAll(',', '.')

export const SalaryReportTab = ({ data, reportId,  outliers, outlierDate }: SalaryReportTabProps) => {
  return (
    <Stack space={6}>
      <SalaryDistributionChart data={data} />
      <SalaryStatistics maleAverageSalary={formatSalary(data.totals.maleAverageSalary)} femaleAverageSalary={formatSalary(data.totals.femaleAverageSalary)} wageGapPercent={data.totals.wageGapPercent?.toString() ?? '0'} />
      <OutlierPlanTable outliers={outliers} />
      <OutlierInputForm outlierDate={outlierDate} />
    </Stack>
  )
}
