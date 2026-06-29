import { Box } from '@dmr.is/ui/components/island-is/Box'

import { Stack } from '@island.is/island-ui/core'

import {
  ReportOutlierGroupDto,
  SalaryByGenderAndScoreDto,
} from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { formatSalary } from '../../../../lib/utils'
import { Empty } from '../../../Empty'
import { OutlierPlanTable } from './OutlierPlanTable'
import { SalaryDistributionChart } from './SalaryDistributionChart'
import { SalaryStatistics } from './SalaryStatistics'

interface SalaryReportTabProps {
  data: SalaryByGenderAndScoreDto
  reportId: string
  groups: ReportOutlierGroupDto[]
  outlierDate?: Date
  outliersPostponed?: boolean
}

export const SalaryReportTab = ({
  data,
  reportId,
  groups,
  outliersPostponed,
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
      {groups.length > 0 && (
        <Box marginBottom={4}>
          <OutlierPlanTable
            reportId={reportId}
            groups={groups}
            outliersPostponed={outliersPostponed}
            outlierDate={outlierDate}
          />
        </Box>
      )}
    </Stack>
  )
}
