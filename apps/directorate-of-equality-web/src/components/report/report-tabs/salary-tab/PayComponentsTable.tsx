'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { type BenefitsBreakdownDto } from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { formatPercent, formatSalary } from '../../../../lib/utils'

import { type ColumnDef } from '@tanstack/react-table'

const t = reportText.salaryTab.components

/**
 * Viðbótarlaun and aukagreiðslur per gender, with the unadjusted gap per
 * component.
 *
 * ⚠️ **These are monthly krónur, not kr./klst.** Every other figure on this page
 * is a rate — reglulegt tímakaup and the gaps derived from it — so the one block
 * that is not has to say so, which is what the description does. The API returns
 * these raw and deliberately does NOT divide them by greiddar stundir: they are
 * pay components, and dividing them would double-count the hours already in the
 * tímakaup figures above.
 *
 * The bottom row is the **óleiðrétti** gap per component: a plain difference of
 * means, no Oaxaca, no compliance role. It can reach magnitudes like −300%,
 * which is not an error — if women average four times the men's viðbótarlaun
 * then `(male − female) / male` genuinely is −300%. Small denominators make this
 * row volatile, which is exactly why it is informational and kept away from the
 * leiðréttur figure that decides anything.
 */
type Row = {
  label: string
  additional: string
  bonus: string
  total: string
  /** Styles the gap row apart from the three krónur rows. */
  isGap?: boolean
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'label',
    header: t.genderHeader,
    cell: ({ row }) => (
      <Text
        variant="small"
        fontWeight={
          row.original.isGap || row.original.label === t.overall
            ? 'semiBold'
            : 'regular'
        }
      >
        {row.original.label}
      </Text>
    ),
  },
  {
    accessorKey: 'additional',
    header: t.additionalHeader,
    cell: ({ row }) => <Text variant="small">{row.original.additional}</Text>,
  },
  {
    accessorKey: 'bonus',
    header: t.bonusHeader,
    cell: ({ row }) => <Text variant="small">{row.original.bonus}</Text>,
  },
  {
    accessorKey: 'total',
    header: t.totalHeader,
    cell: ({ row }) => (
      <Text variant="small" fontWeight="semiBold">
        {row.original.total}
      </Text>
    ),
  },
]

/** Monthly krónur. `formatHourlyRate` would be wrong here — see the note above. */
const kr = (value: number) => formatSalary(value)

export const PayComponentsTable = ({
  data,
}: {
  data?: BenefitsBreakdownDto | null
}) => {
  if (!data) return null

  // Nothing to show when no one has any of these components. Rendering three
  // rows of zeros reads as a finding ("nobody gets overtime") rather than as an
  // empty section.
  const nothingRecorded =
    data.overall.averageTotal === 0 && data.overall.count > 0

  const rows: Row[] = [
    {
      label: t.male,
      additional: kr(data.male.averageAdditionalSalary),
      bonus: kr(data.male.averageBonusSalary),
      total: kr(data.male.averageTotal),
    },
    {
      label: t.female,
      additional: kr(data.female.averageAdditionalSalary),
      bonus: kr(data.female.averageBonusSalary),
      total: kr(data.female.averageTotal),
    },
    {
      label: t.overall,
      additional: kr(data.overall.averageAdditionalSalary),
      bonus: kr(data.overall.averageBonusSalary),
      total: kr(data.overall.averageTotal),
    },
    {
      label: t.gapRow,
      // Signed: the direction carries the meaning here, and unlike the
      // leiðréttur figure this one is never compared to a benchmark, so there is
      // no reason to strip it to a magnitude.
      additional: formatPercent(data.additionalWageGapPercent, { signed: true }),
      bonus: formatPercent(data.bonusWageGapPercent, { signed: true }),
      total: formatPercent(data.totalWageGapPercent, { signed: true }),
      isGap: true,
    },
  ]

  return (
    <Box marginTop={4}>
      <Stack space={2}>
        <Text variant="h4">{t.heading}</Text>
        <Text variant="default">{t.description}</Text>
        {nothingRecorded ? (
          <Text variant="small" color="dark300">
            {t.empty}
          </Text>
        ) : (
          <>
            <Table columns={columns} data={rows} />
            <Text variant="small" color="dark300">
              {t.gapHint}
            </Text>
          </>
        )}
      </Stack>
    </Box>
  )
}
