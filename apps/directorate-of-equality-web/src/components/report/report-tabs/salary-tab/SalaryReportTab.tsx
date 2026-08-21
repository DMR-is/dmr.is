import { Box } from '@dmr.is/ui/components/island-is/Box'

import { Stack } from '@island.is/island-ui/core'

import {
  type BenefitsBreakdownDto,
  ReportOutlierGroupDto,
  SalaryByGenderAndScoreDto,
  SalaryDataBasisEnum,
  type WageGapDecompositionDto,
} from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { formatSalary } from '../../../../lib/utils'
import { Empty } from '../../../Empty'
import { OutlierPlanTable } from './OutlierPlanTable'
import { PayComponentsTable } from './PayComponentsTable'
import { SalaryDistributionChart } from './SalaryDistributionChart'
import { SalaryStatistics } from './SalaryStatistics'

interface SalaryReportTabProps {
  data: SalaryByGenderAndScoreDto
  /**
   * The frozen decomposition off `report_result`. Optional because a report
   * whose result has not been computed has none — the leiðréttur block then
   * does not render, rather than rendering a zero.
   */
  decomposition?: WageGapDecompositionDto | null
  /** Viðbótarlaun / aukagreiðslur per gender — monthly krónur, not rates. */
  payComponents?: BenefitsBreakdownDto | null
  reportId: string
  groups: ReportOutlierGroupDto[]
  outlierDate?: Date
  outliersPostponed?: boolean
  salaryDataBasis?: SalaryDataBasisEnum | null
  salaryDataPeriod?: string | null
}

export const SalaryReportTab = ({
  data,
  decomposition,
  payComponents,
  reportId,
  groups,
  outliersPostponed,
  outlierDate,
  salaryDataBasis,
  salaryDataPeriod,
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
      <SalaryDistributionChart data={data} decomposition={decomposition} />
      {/* Below the chart, as its own section — monthly krónur, so it is kept
          clear of the tímakaup figures rather than mixed among them. */}
      <PayComponentsTable data={payComponents} />
      <SalaryStatistics
        maleAverageSalary={formatSalary(data.totals.maleAverageSalary)}
        femaleAverageSalary={formatSalary(data.totals.femaleAverageSalary)}
        decomposition={decomposition}
        salaryDataBasis={salaryDataBasis}
        salaryDataPeriod={salaryDataPeriod}
      />
      {groups.length > 0 && (
        <Box marginBottom={4}>
          <OutlierPlanTable
            reportId={reportId}
            groups={groups}
            minimumSetSize={decomposition?.minimumSetSize}
            outliersPostponed={outliersPostponed}
            outlierDate={outlierDate}
          />
        </Box>
      )}
    </Stack>
  )
}
