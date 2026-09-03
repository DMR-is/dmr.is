import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import {
  type PayDispersionDto,
  type PayDispersionEmployeeDto,
} from '../../../../gen/fetch'
import { reportText, sharedText } from '../../../../lib/text'
import {
  formatHourlyRate,
  formatPercent,
  formatSalary,
} from '../../../../lib/utils'

import { type ColumnDef } from '@tanstack/react-table'

const p = reportText.salaryTab.payDispersion

/**
 * The one population whose ROWS are approved for display.
 *
 * Typed off the DTO rather than written as a bare literal in the comparison, so
 * renaming the API's enum member breaks this compile instead of silently making
 * the gate always-true. openapi-ts emits a union type, not an enum value, so a
 * typed constant is the closest available equivalent.
 */
const RENDERED_POPULATION: PayDispersionDto['population'] = 'ALL_EMPLOYEES'

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

/**
 * The same figure without its sign, for prose that already states the direction
 * in words. "víkja 2,51 staðalvik niður" — printing "−2,51 staðalvik niður"
 * states the direction twice and invites the reader to wonder which is right.
 * Mirrors `formatSpreadMagnitude` in the PDF template (change both together).
 */
const formatSpreadMagnitude = (value: number): string =>
  Math.abs(value).toFixed(2).replace('.', ',')


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
    // ⚠️ No `grow` here, deliberately. Every column in this table is a number or
    // an enum — there is no text column to absorb slack, and putting `grow` on one
    // of the two identically-shaped wage columns stretches it while its twin
    // collapses. With `layout="auto"` and `width: 1` on the five `fit` columns,
    // the two wage columns share what is left, which is the balanced result.
    accessorKey: 'expectedHourlyWage',
    header: p.predictedSalary,
    cell: ({ getValue }) => formatHourlyRate(getValue<number>()),
    enableSorting: false,
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
  // Absent on an older API response — render nothing rather than throwing.
  if (!payDispersion) return null
  // ⚠️ Gates the LIST, not the section — and that distinction is the whole point.
  //
  // `EXCLUDING_MINIMUM_SET` rows are computed and shipped so the contract is
  // ready, but have not been requested yet: deliberately unrendered, NOT unused,
  // so do not remove this branch. What must NOT be skipped is a blocked report —
  // it has no rows to withhold, so it renders its `blockers` reason whatever the
  // population says. Gating the section instead left a company over the benchmark
  // and under the 12-employee floor showing nothing at all.
  if (
    payDispersion.available &&
    payDispersion.population !== RENDERED_POPULATION
  ) {
    return null
  }

  const {
    available,
    blockers,
    employees,
    cohortResidualSpreadPercentUp,
    cohortResidualSpreadPercentDown,
    countBelowExpected,
    countAboveExpected,
    chanceCriticalSpreads,
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
              <Text key={code} variant="small" color="dark350">
                {p.blockers[code as keyof typeof p.blockers] ?? code}
              </Text>
            ))}
          </Stack>
        ) : /* ⚠️ On the TRUE counts, NOT on `employees.length`. The array is a
               shortlist, and a suppressed tie group is precisely the case where
               employees qualified and no rows were produced — reading the array
               here would print the all-clear copy on a report that found 312
               people off the line. */
        countBelowExpected === 0 && countAboveExpected === 0 ? (
          <Text variant="small" color="dark350">
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
                <Text variant="small" color="dark350">
                  {p.spreadNote(
                    formatPercent(cohortResidualSpreadPercentDown),
                    formatPercent(cohortResidualSpreadPercentUp, {
                      signed: true,
                    }),
                  )}
                </Text>
              )}
            {/* The pool, then what was drawn from it — in that order, because
                the second sentence only makes sense once the first has given a
                number to draw from. */}
            <Text variant="small" color="dark350">
              {p.counts(
                String(payDispersion.threshold).replace('.', ','),
                formatSalary(countBelowExpected),
                formatSalary(countAboveExpected),
              )}
            </Text>
            <Text variant="small" color="dark350">
              {p.listRule}
            </Text>
            {chanceCriticalSpreads != null && (
              <Text variant="small" color="dark350">
                {p.chanceNote(formatSpreadMagnitude(chanceCriticalSpreads))}
              </Text>
            )}
            <PayDispersionDirection
              heading={p.headingBelow}
              rows={employees.filter((row) => row.studentizedResidual < 0)}
            />
            <PayDispersionDirection
              heading={p.headingAbove}
              rows={employees.filter((row) => row.studentizedResidual > 0)}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

interface PayDispersionDirectionProps {
  heading: string
  /** This direction's ábendingar. The list IS the finding, not a sample of it. */
  rows: PayDispersionEmployeeDto[]
}

/**
 * One direction of the list.
 *
 * ⚠️ **Two headings, because the two directions are different findings.** An
 * employee paid far below what their stig imply and one paid far above are not
 * variations of one observation, and mixing them buries the first among the
 * second.
 *
 * ⚠️ **No count in the heading, deliberately.** It would only restate the number
 * of rows beneath it. The figures worth stating are the POOL — how many
 * employees sit past the threshold — and those are in the `counts` sentence
 * above, once, rather than split across two headings.
 *
 * Renders nothing when a direction has nothing: a heading over an empty table
 * reads as a finding that failed to print.
 */
const PayDispersionDirection = ({
  heading,
  rows,
}: PayDispersionDirectionProps) => {
  if (rows.length === 0) return null

  return (
    <Stack space={1}>
      <Text variant="h5">{heading}</Text>
      {/*
        ⚠️ `layout="auto"` is REQUIRED by the `fit` meta on the columns — see the
        ColumnMeta docstring in the shared Table. Without it the table defaults to
        `fixed` while `sizingStyle` still applies `width: 1; nowrap`, so every fit
        column is pinned to 1px and its content overflows the cell.
        `OutlierGroupTable` passes it for the same reason.
      */}
      <Table columns={columns} data={rows} layout="auto" />
    </Stack>
  )
}
