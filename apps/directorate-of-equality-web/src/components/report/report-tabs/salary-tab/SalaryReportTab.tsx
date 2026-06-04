import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { Stack } from '@island.is/island-ui/core'

import {
  Paging,
  ReportEmployeeOutlierDto,
  SalaryByGenderAndScoreDto,
} from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { formatSalary } from '../../../../lib/utils'
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
  outliersPostponed?: boolean
}

export const SalaryReportTab = ({
  data,
  outliers,
  outliersPostponed,
  outliersPaging,
  outliersLoading,
  onOutliersPageChange,
  outlierDate,
}: SalaryReportTabProps) => {
  if (!data) {
    return (
      <Empty
        title={reportText.salaryTab.emptyTitle}
        message={reportText.salaryTab.emptyMessage}
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
      {outliers.length > 0 && (
        <Box marginBottom={4}>
          <OutlierPlanTable
            outliers={outliers}
            paging={outliersPaging}
            loading={outliersLoading}
            outliersPostponed={outliersPostponed}
            outlierDate={outlierDate}
            onPageChange={onOutliersPageChange}
          />
        </Box>
      )}
    </Stack>
  )
}
