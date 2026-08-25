import { Box } from '@dmr.is/ui/components/island-is/Box'

import { Stack } from '@island.is/island-ui/core'

import {
  type BenefitsBreakdownDto,
  type PayDispersionDto,
  ReportOutlierGroupDto,
  SalaryByGenderAndScoreDto,
  SalaryDataBasisEnum,
  type WageGapDecompositionDto,
} from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { foldDeviationDirection, formatSalary } from '../../../../lib/utils'
import { Empty } from '../../../Empty'
import { OutlierPlanTable } from './OutlierPlanTable'
import { PayComponentsTable } from './PayComponentsTable'
import { PayDispersionTable } from './PayDispersionTable'
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
  /**
   * Ábendingar — informational, derived on read rather than frozen. A SECOND
   * instrument: see `PayDispersionTable`, which renders nothing at all unless the
   * company is within the benchmark.
   */
  payDispersion?: PayDispersionDto | null
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
  payDispersion,
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

  const members = (decomposition?.employees ?? []).filter(
    (employee) => employee.inMinimumSet,
  )

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
      {/* ⚠️ Below the úrbótaáætlun, and OUTSIDE the `groups.length > 0` gate on
          purpose: the two are mutually exclusive by construction. Ábendingar
          render only when the company is within the benchmark, which is exactly
          when the lágmarksmengi — and therefore `groups` — is empty. */}
      <PayDispersionTable payDispersion={payDispersion} />
      {groups.length > 0 && (
        <Box marginBottom={4}>
          <OutlierPlanTable
            reportId={reportId}
            groups={groups}
            minimumSetSize={decomposition?.minimumSetSize}
            // ⚠️ Folded over the SNAPSHOT, not over the table's rows. The
            // groups below are paged at 10, so folding the fetched rows would
            // report "below" for a group whose overpaid member happens to sit
            // on page 2. The snapshot carries every member of the set.
            //
            // No `members.length > 0` guard: the fold itself returns `undefined`
            // when there is nothing to fold, and the prompt then does not render.
            // Guarding here as well would just be a second place to get it wrong.
            direction={foldDeviationDirection(
              members.map((employee) => employee.payStatus),
            )}
            outliersPostponed={outliersPostponed}
            outlierDate={outlierDate}
          />
        </Box>
      )}
    </Stack>
  )
}
