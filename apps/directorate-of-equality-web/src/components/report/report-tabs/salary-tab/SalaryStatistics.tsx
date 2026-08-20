import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { SalaryDataBasisEnum } from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { StatisticCard } from '../../../StatisticCard'
import { SalaryDataBasis } from './SalaryDataBasis'

interface SalaryStatisticsProps {
  maleAverageSalary: string
  femaleAverageSalary: string
  /**
   * `null` when the gap is genuinely not computable — e.g. only one gender is
   * present in the report. Do NOT default this to '0': a company that cannot
   * be measured is not a company with no pay gap, and rendering 0% states the
   * opposite of what is known.
   */
  wageGapPercent: string | null
  salaryDataBasis?: SalaryDataBasisEnum | null
  salaryDataPeriod?: string | null
}

export const SalaryStatistics = ({
  maleAverageSalary,
  femaleAverageSalary,
  wageGapPercent,
  salaryDataBasis,
  salaryDataPeriod,
}: SalaryStatisticsProps) => {
  return (
    <Box marginBottom={4}>
      <Stack space={2}>
        <Text variant="h4">{reportText.salaryTab.wageGapLabel}</Text>
        <Text variant="default">{reportText.salaryTab.wageGapDescription}</Text>
        {/* Frames the figures below: which period they describe. */}
        <SalaryDataBasis basis={salaryDataBasis} period={salaryDataPeriod} />
        <Box
          display="flex"
          columnGap={[0, 0, 0, 4]}
          rowGap={[2, 2, 2, 0]}
          marginTop={1}
          flexDirection={['column', 'column', 'column', 'row']}
        >
          <StatisticCard
            title={reportText.salaryTab.avgSalaryMale}
            content={maleAverageSalary}
          />
          <StatisticCard
            title={reportText.salaryTab.avgSalaryFemale}
            content={femaleAverageSalary}
          />
          <StatisticCard
            title={reportText.salaryTab.wageGapLabel}
            content={wageGapPercent === null ? '—' : `${wageGapPercent}%`}
            color="purple"
          />
        </Box>
      </Stack>
    </Box>
  )
}
