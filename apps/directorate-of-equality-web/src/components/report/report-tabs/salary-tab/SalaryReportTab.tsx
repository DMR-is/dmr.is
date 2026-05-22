import { Stack } from '@island.is/island-ui/core'

import {
  Paging,
  ReportEmployeeOutlierDto,
  SalaryByGenderAndScoreDto,
} from '../../../../gen/fetch'
import { Empty } from '../../../Empty'
import { OutlierInputForm } from './OutlierInputForm'
import { OutlierPlanTable } from './OutlierPlanTable'
import { SalaryDistributionChart } from './SalaryDistributionChart'
import { SalaryStatistics } from './SalaryStatistics'

interface SalaryReportTabProps {
  data: SalaryByGenderAndScoreDto
  outliers: ReportEmployeeOutlierDto[]
  outliersPaging?: Paging
  outliersLoading?: boolean
  onOutliersPageChange: (page: number) => void
  outlierDate?: Date
}

const formatSalary = (v: number) =>
  new Intl.NumberFormat('is-IS').format(Math.round(v)).replaceAll(',', '.')

export const SalaryReportTab = ({
  data,
  outliers,
  outliersPaging,
  outliersLoading,
  onOutliersPageChange,
  outlierDate,
}: SalaryReportTabProps) => {
  if (!data) {
    return (
      <Empty
        title="Engin launagreining"
        message="Engin launagreining fannst fyrir þessa skýrslu. Vinsamlegast hafðu samband við fyrirtækið til að fá frekari upplýsingar."
      />
    )
  }

  return (
    <Stack space={6}>
      <SalaryDistributionChart data={data} />
      <SalaryStatistics
        maleAverageSalary={formatSalary(data.totals.maleAverageSalary)}
        femaleAverageSalary={formatSalary(data.totals.femaleAverageSalary)}
        wageGapPercent={data.totals.wageGapPercent?.toString() ?? '0'}
      />
      <OutlierPlanTable
        outliers={outliers}
        paging={outliersPaging}
        loading={outliersLoading}
        onPageChange={onOutliersPageChange}
      />
      <OutlierInputForm outlierDate={outlierDate} />
    </Stack>
  )
}
