import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

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
    <Stack space={2}>
      <Text variant="h4">Launamunur</Text>
      <Text variant="default">
        Óleiðréttur launamunur milli karla og kvenna
      </Text>
      <Box display="flex" columnGap={4} marginTop={1}>
        <StatisticCard title="Meðallaun karla" content={maleAverageSalary} />
        <StatisticCard title="Meðallaun kvenna" content={femaleAverageSalary} />
        <StatisticCard
          title="Launamunur"
          content={wageGapPercent + '%'}
          color="purple"
        />
      </Box>
    </Stack>
  )
}
