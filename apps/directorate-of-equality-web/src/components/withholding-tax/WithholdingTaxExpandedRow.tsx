'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { type WithholdingTaxJobCountDto } from '../../gen/fetch/types.gen'
import { useIsTablet } from '../../hooks/useIsTablet'
import { withholdingTaxText } from '../../lib/text'
import { formatNationalId } from '../../lib/utils'
import * as styles from './WithholdingTaxExpandedRow.css'

const c = withholdingTaxText.columns

const FIELDS: {
  label: string
  value: (row: WithholdingTaxJobCountDto) => string | number | null | undefined
}[] = [
  { label: c.name, value: (r) => r.name },
  { label: c.nationalId, value: (r) => formatNationalId(r.nationalId) },
  { label: c.address, value: (r) => r.legalAddress },
  { label: c.postcode, value: (r) => r.postcode },
  { label: c.city, value: (r) => r.city },
  { label: c.cityId, value: (r) => r.cityId },
  { label: c.isatCode, value: (r) => r.isatCode },
  { label: c.isatText, value: (r) => r.isatText },
  { label: c.band, value: (r) => r.jobCountBand },
  { label: c.incomeYear, value: (r) => r.incomeYear },
]

/** Every value Skatturinn returned for one company, like Vinnslusvæði's rows. */
export const WithholdingTaxExpandedRow = ({
  row,
}: {
  row: WithholdingTaxJobCountDto
}) => {
  const { isTablet } = useIsTablet()

  return (
    <Box background="blue100" padding={2}>
      <div className={styles.grid}>
        {FIELDS.map(({ label, value }, index) => (
          <Box
            key={label}
            background={
              (isTablet ? index % 2 : Math.floor(index / 2) % 2) === 0
                ? 'white'
                : 'blue100'
            }
            paddingX={1}
            paddingY={1}
            className={styles.item}
          >
            <Box display="flex">
              <div className={styles.label}>
                <Text variant="small" fontWeight="semiBold">
                  {label}
                </Text>
              </div>
              <Text variant="small">{value(row) ?? '–'}</Text>
            </Box>
          </Box>
        ))}
      </div>
    </Box>
  )
}
