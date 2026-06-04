import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'

import { Stack } from '@island.is/island-ui/core'

import {
  Paging,
  ReportEmployeeOutlierDto,
  SalaryByGenderAndScoreDto,
} from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { Empty } from '../../../Empty'
import { OutlierInputForm } from './OutlierInputForm'
import { OutlierPlanTable } from './OutlierPlanTable'
import { SalaryDistributionChart } from './SalaryDistributionChart'
import { SalaryStatistics } from './SalaryStatistics'

import { type SortingState } from '@tanstack/react-table'

interface SalaryReportTabProps {
  data: SalaryByGenderAndScoreDto
  outliers: ReportEmployeeOutlierDto[]
  outliersPaging?: Paging
  outliersLoading?: boolean
  onOutliersPageChange: (page: number) => void
  outliersSorting?: SortingState
  onOutliersSortingChange?: (sorting: SortingState) => void
  outlierDate?: Date
  outliersPostponed?: boolean
}

const formatSalary = (v: number) =>
  new Intl.NumberFormat('is-IS').format(Math.round(v)).replaceAll(',', '.')

export const SalaryReportTab = ({
  data,
  outliers,
  outliersPostponed,
  outliersPaging,
  outliersLoading,
  onOutliersPageChange,
  outliersSorting,
  onOutliersSortingChange,
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
        <>
          {outliersPostponed && (
            <AlertMessage
              type="warning"
              title={reportText.salaryTab.outliersPostponedTitle}
              message={reportText.salaryTab.outliersPostponedMessage}
            />
          )}
          <OutlierPlanTable
            outliers={outliers}
            paging={outliersPaging}
            loading={outliersLoading}
            onPageChange={onOutliersPageChange}
            sorting={outliersSorting}
            onSortingChange={onOutliersSortingChange}
          />
          <OutlierInputForm outlierDate={outlierDate} />
        </>
      )}
    </Stack>
  )
}
