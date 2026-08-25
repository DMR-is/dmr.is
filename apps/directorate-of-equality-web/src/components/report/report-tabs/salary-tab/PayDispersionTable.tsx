import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import {
  type PayDispersionDto,
  type PayDispersionEmployeeDto,
} from '../../../../gen/fetch'
import { reportText, sharedText } from '../../../../lib/text'
import { formatHourlyRate, formatPercent } from '../../../../lib/utils'

import { type ColumnDef } from '@tanstack/react-table'

const p = reportText.salaryTab.payDispersion

/**
 * Spreads, to two decimals, Icelandic comma. Deliberately NOT `formatPercent`:
 * this is a count of standard deviations, not a percentage, and printing a `%`
 * on it would invite comparison with the Launafrávik column beside it. One
 * decimal is also too coarse — 2,5 and 2,5 would hide the ordering between two
 * rows that 2,53 and 2,49 make plain.
 */
const formatSpreads = (value: number | null | undefined): string =>
  value == null
    ? dash
    : `${value > 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}`

const dash = '–'

const genderMap: Record<string, string> = {
  MALE: sharedText.genders.male,
  FEMALE: sharedText.genders.female,
  NEUTRAL: sharedText.genders.neutral,
}

/**
 * ⚠️ **Deliberately not built like `OutlierGroupTable`.**
 *
 * No accordions, no group column, no `reason`/`action` inputs, no signature
 * block, no paging and no sorting. Every one of those is an affordance of the
 * úrbótaáætlun — a list the employer must answer for — and this list asks for
 * nothing. A reviewer who mistakes one for the other starts asking a company to
 * account for rows it owes no account of, which is the failure this component is
 * shaped to prevent.
 *
 * Sorting is omitted for a second reason: the order IS the finding. Rows arrive
 * most-extreme-first from the API, which is the order a reader wants, and there
 * is no server-side sort to page against.
 */
const columns: ColumnDef<PayDispersionEmployeeDto>[] = [
  {
    accessorKey: 'employeeOrdinal',
    header: p.numberHeader,
    cell: ({ getValue }) => getValue<number | null>() ?? dash,
    enableSorting: false,
    meta: { fit: true },
  },
  {
    accessorKey: 'gender',
    header: p.genderHeader,
    cell: ({ getValue }) => genderMap[getValue<string>()] ?? getValue<string>(),
    enableSorting: false,
    meta: { fit: true },
  },
  {
    accessorKey: 'score',
    header: p.points,
    cell: ({ getValue }) => getValue<number | null>() ?? dash,
    enableSorting: false,
    meta: { fit: true },
  },
  {
    accessorKey: 'regularHourlyWage',
    header: p.salary,
    cell: ({ getValue }) => formatHourlyRate(getValue<number>()),
    enableSorting: false,
  },
  {
    // Absorbs the width the `fit` columns do not use, so they collapse to their
    // content instead of the browser distributing slack across all seven.
    accessorKey: 'expectedHourlyWage',
    header: p.predictedSalary,
    cell: ({ getValue }) => formatHourlyRate(getValue<number>()),
    enableSorting: false,
    meta: { grow: true },
  },
  {
    id: 'deviationPercent',
    header: p.deviationHeader,
    // Same convention as the úrbótaáætlun and the PDF: the sign carries the
    // direction, but only for a reader who knows the convention, so the word
    // says it outright.
    cell: ({ row }) => {
      const percent = formatPercent(row.original.deviationPercent, {
        signed: true,
      })
      const word =
        row.original.payStatus === 'UNDERPAID'
          ? p.directionBelow
          : row.original.payStatus === 'OVERPAID'
            ? p.directionAbove
            : null

      return word ? `${percent} (${word})` : percent
    },
    enableSorting: false,
    meta: { fit: true },
  },
  {
    id: 'studentizedResidual',
    header: p.spreadHeader,
    /**
     * The column that explains the selection, and the counterpart to the
     * úrbótaáætlun's `Hlutur af óskýrðu`. Without it a reader asks why someone
     * 30% off the line is listed while a colleague 25% off is not — the answer
     * being that the cut-off is measured in this company's own spread, and that
     * an employee at the far end of the stig range moves the line toward
     * themselves and so has their deviation understated.
     */
    cell: ({ row }) => formatSpreads(row.original.studentizedResidual),
    enableSorting: false,
    meta: { fit: true },
  },
]

interface PayDispersionTableProps {
  /** Absent on an older API response — the section then does not render. */
  payDispersion?: PayDispersionDto | null
}

export const PayDispersionTable = ({
  payDispersion,
}: PayDispersionTableProps) => {
  // ⚠️ Rendered ONLY for the compliant population. `EXCLUDING_MINIMUM_SET` is
  // computed and shipped so the contract is ready, but has not been requested
  // yet — turning it on is deleting this condition and writing the copy for it.
  // Deliberately unrendered, NOT unused: do not remove the branch. Optional-chained rather than compared directly, so
  // an older API response (where the field is absent) renders nothing instead of
  // throwing.
  if (!payDispersion) return null
  // ⚠️ Blocker states must survive this gate. `population` is ALL_EMPLOYEES
  // whenever no lágmarksmengi was withheld — which includes every snapshot where
  // no gap is computable — so a report that cannot be assessed still renders its
  // reason. Only a PRODUCIBLE list for the not-yet-approved population is skipped.
  if (payDispersion.available && payDispersion.population !== 'ALL_EMPLOYEES') {
    return null
  }

  const {
    available,
    blockers,
    employees,
    cohortResidualSpreadPercentUp,
    cohortResidualSpreadPercentDown,
  } = payDispersion

  return (
    <Box marginBottom={4}>
      <Stack space={2}>
        <Text variant="h4">{p.heading}</Text>

        {/* ⚠️ Three distinct states, and an empty table is only ONE of them.
            "Cannot be assessed" must never render as "nothing to report". */}
        {!available ? (
          <Stack space={1}>
            {blockers.map((code) => (
              <Text key={code} variant="small" color="dark300">
                {p.blockers[code as keyof typeof p.blockers] ?? code}
              </Text>
            ))}
          </Stack>
        ) : employees.length === 0 ? (
          <Text variant="small" color="dark300">
            {p.allClear}
          </Text>
        ) : (
          <Stack space={2}>
            <Text variant="default">{p.intro}</Text>
            {/*
              The sentence that keeps this from reading as a second
              úrbótaáætlun. Not optional — and deliberately NOT `dark300`: that
              muted grey is for de-emphasised asides, and this is the most
              load-bearing sentence in the section. Muting the one line that says
              "you owe nothing for this" is exactly the wrong emphasis, and it
              also puts the contrast below AA.
            */}
            <Text variant="default" fontWeight="semiBold">
              {p.noObligation}
            </Text>
            {cohortResidualSpreadPercentUp != null &&
              cohortResidualSpreadPercentDown != null && (
                <Text variant="small" color="dark300">
                  {p.spreadNote(
                    formatPercent(cohortResidualSpreadPercentDown),
                    formatPercent(cohortResidualSpreadPercentUp, {
                      signed: true,
                    }),
                    String(payDispersion.threshold).replace('.', ','),
                  )}
                </Text>
              )}
            {/*
              ⚠️ `layout="auto"` is REQUIRED by the `fit`/`grow` meta above — see
              the ColumnMeta docstring in the shared Table. Without it the table
              defaults to `fixed` while `sizingStyle` still applies
              `width: 1; nowrap`, so every fit column is pinned to 1px and its
              content overflows the cell. `OutlierGroupTable` passes it for the
              same reason.
            */}
            <Table columns={columns} data={employees} layout="auto" />
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
