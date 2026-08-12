import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { SalaryDataBasisEnum } from '../../../../gen/fetch'
import { formatMonthYearIS } from '../../../../lib/constants'
import { reportText } from '../../../../lib/text'

const t = reportText.salaryTab

interface SalaryDataBasisProps {
  /** Null on reports submitted before the company had to declare this. */
  basis?: SalaryDataBasisEnum | null
  /** `YYYY-MM-01`. Only ever set alongside a `MONTH` basis. */
  period?: string | null
}

/**
 * What period the submitted salary figures describe — one specific payroll month
 * or a twelve-month average. Sits inside the Launamunur block, where it qualifies
 * the average-salary and wage-gap figures it is read alongside.
 *
 * Older reports predate the declaration and show as "not stated" rather than
 * being hidden: for a reviewer, "the company never told us" is itself the
 * answer.
 */
export const SalaryDataBasis = ({ basis, period }: SalaryDataBasisProps) => {
  const value =
    basis === SalaryDataBasisEnum.MONTH
      ? period
        ? `${t.dataBasisMonth} — ${formatMonthYearIS(period)}`
        : t.dataBasisMonth
      : basis === SalaryDataBasisEnum.AVERAGE
        ? t.dataBasisAverage
        : t.dataBasisMissing

  return (
    <Box>
      <Text variant="eyebrow" color="dark400">
        {t.dataBasisLabel}
      </Text>
      <Text variant="default">{value}</Text>
    </Box>
  )
}
