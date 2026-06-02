import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { reportText } from '../../../../lib/text'
import { StatisticCard } from '../../../StatisticCard'

interface SalaryStatisticsProps {
  maleAverageSalary: string
  femaleAverageSalary: string
  wageGapPercent: string
}

export const SalaryStatistics = ({
  maleAverageSalary,
  femaleAverageSalary,
  wageGapPercent,
}: SalaryStatisticsProps) => {
  return (
    <Box marginBottom={4}>
      <Stack space={2}>
        <Text variant="h4">{reportText.salaryTab.wageGapLabel}</Text>
        <Text variant="default">{reportText.salaryTab.wageGapDescription}</Text>
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
            content={wageGapPercent + '%'}
            color="purple"
          />
        </Box>
      </Stack>
    </Box>
  )
}
