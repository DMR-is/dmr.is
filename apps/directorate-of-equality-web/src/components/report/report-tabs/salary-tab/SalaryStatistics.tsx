import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  SalaryDataBasisEnum,
  type WageGapDecompositionDto,
} from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { formatPercent } from '../../../../lib/utils'
import { StatisticCard } from '../../../StatisticCard'
import { SalaryDataBasis } from './SalaryDataBasis'

const t = reportText.salaryTab

interface SalaryStatisticsProps {
  maleAverageSalary: string
  femaleAverageSalary: string
  /**
   * The frozen decomposition off `report_result`. Absent for a report whose
   * result has not been computed — the leiðréttur group then does not render at
   * all, which is honest: there is no figure, not a figure of zero.
   */
  decomposition?: WageGapDecompositionDto | null
  salaryDataBasis?: SalaryDataBasisEnum | null
  salaryDataPeriod?: string | null
}

/**
 * Maps the API's direction code to Icelandic. Codes only cross the wire.
 *
 * Shared by both gap cards on purpose: óleiðréttur and leiðréttur are different
 * figures but the same convention — magnitude plus an explicit direction, never
 * a signed percentage.
 */
const disfavourLabel = (
  direction:
    | WageGapDecompositionDto['oskyrtDirection']
    | WageGapDecompositionDto['rawGapDirection'],
): string => {
  if (direction === 'FEMALE') return t.disfavourFemale
  if (direction === 'MALE') return t.disfavourMale
  return t.disfavourNone
}

export const SalaryStatistics = ({
  maleAverageSalary,
  femaleAverageSalary,
  decomposition,
  salaryDataBasis,
  salaryDataPeriod,
}: SalaryStatisticsProps) => {
  return (
    <Stack space={6}>
      {/* ── Group 1: the two averages and the raw gap they imply ──────────── */}
      <Box>
        <Stack space={2}>
          <Text variant="h4">{t.unadjustedGroupHeading}</Text>
          <Text variant="default">{t.wageGapDescription}</Text>
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
              title={t.avgSalaryMale}
              content={maleAverageSalary}
            />
            <StatisticCard
              title={t.avgSalaryFemale}
              content={femaleAverageSalary}
            />
            {/*
              Sits with the two averages on purpose: it is
              `(hærri − lægri) / hærri` on ARITHMETIC means, so a reader can
              subtract the cards either side of it and arrive at this number.
              That self-verification is why the arithmetic basis was chosen over
              the geometric one, which is stored but not shown.

              ⚠️ Reads `rawGapPercent` off the decomposition, NOT
              `totals.wageGapPercent`. The latter is `(male − female) / male` —
              signed, and with the denominator fixed to men, so the same
              inequality yields a different magnitude depending on which gender
              is ahead (4,00% one way, 4,17% the other on a 100/96 split). That
              form was considered and explicitly rejected; the API exposes
              `rawGapPercent`/`rawGapDirection` for this card precisely so the
              magnitude is symmetric and the direction is stated rather than
              encoded in a minus sign — matching the leiðréttur card below.

              It also went through `.toString()` before, so it rendered a JS
              decimal POINT (`4.2%`) on an Icelandic page while the PDF rendered
              `+4,2%` through `formatPercent`. Same number, two renderings.
            */}
            <StatisticCard
              title={t.wageGapLabel}
              content={
                decomposition?.rawGapPercent == null
                  ? '—'
                  : `${formatPercent(decomposition.rawGapPercent)} ${disfavourLabel(decomposition.rawGapDirection)}`
              }
            />
          </Box>
        </Stack>
      </Box>

      {/* ── Group 2: the compliance figure, deliberately apart ────────────── */}
      {decomposition && (
        <Box>
          <Stack space={2}>
            <Text variant="h4">{t.adjustedGroupHeading}</Text>
            <Text variant="default">{t.adjustedDescription}</Text>
            <AdjustedGapContent decomposition={decomposition} />
          </Stack>
        </Box>
      )}
    </Stack>
  )
}

/**
 * The leiðréttur block. Splits on `oskyrtAvailable` rather than on the figure
 * being null, because the two mean different things: unavailable is a state the
 * engine reports with reasons, and those reasons are the actionable part of the
 * message ("you have 4 women, we need at least 1").
 */
const AdjustedGapContent = ({
  decomposition: d,
}: {
  decomposition: WageGapDecompositionDto
}) => {
  if (!d.oskyrtAvailable) {
    return (
      <Box marginTop={1}>
        <Stack space={1}>
          <Text variant="h5">{t.cannotCompute}</Text>
          {d.oskyrtBlockers.map((code) => (
            <Text key={code} variant="small">
              {t.blockers[code as keyof typeof t.blockers] ?? code}
            </Text>
          ))}
          {/*
            Counts stay real even when the figures cannot be — this is the
            actionable half of the message: "you have 0 women, we need at least
            one". Own text keys rather than string-surgery on the card labels.
          */}
          <Text variant="small">
            {`${t.cohortCountsLabel}: ${d.counts.male} ${t.cohortMale}, ${d.counts.female} ${t.cohortFemale}`}
          </Text>
        </Stack>
      </Box>
    )
  }

  // ⚠️ Read off the SET, not from comparing percentages.
  //
  // `oskyrtPercent > benchmarkPercent` looks like the obvious test and is subtly
  // wrong: it compares figures rounded to 4dp, while the lágmarksmengi is built
  // from the unrounded log gap. At the boundary those disagree — óskýrt of
  // 0,03978087001184605 against a threshold of 0,0397808700118446 puts one person
  // in the set while the displayed percent rounds to exactly 3,9 and the
  // comparison says "within". This card would then read *Undir viðmiði* directly
  // above a lágmarksmengi of 1.
  //
  // A non-empty set IS "óskýrt exceeds the benchmark" — same greedy walk, same
  // unrounded arithmetic — so the two can never contradict each other. The API's
  // auto-review rule reads the same signal for the same reason.
  const exceeded = d.minimumSetSize > 0

  return (
    <Stack space={2}>
      <Box
        display="flex"
        columnGap={[0, 0, 0, 4]}
        rowGap={[2, 2, 2, 0]}
        marginTop={1}
        flexDirection={['column', 'column', 'column', 'row']}
      >
        {/*
          THE compliance figure. Purple to separate it from the informational
          cards above — those describe the company, this one decides something.
        */}
        <StatisticCard
          title={t.adjustedLabel}
          content={
            d.oskyrtPercent == null
              ? '—'
              : `${formatPercent(d.oskyrtPercent)} ${disfavourLabel(d.oskyrtDirection)}`
          }
          color="purple"
        />
        <StatisticCard
          title={t.benchmarkLabel}
          content={`${formatPercent(d.benchmarkPercent)} · ${
            exceeded ? t.benchmarkExceeded : t.benchmarkWithin
          }`}
        />
        {/*
          The lágmarksmengi count is NOT a card here. It counts rows in the
          úrbótaáætlun table further down the page, so it belongs on that
          heading; sitting beside the two figures above invited reading it as a
          third measurement of the same thing.
        */}
      </Box>

      {/* Soft caveats: the figures ARE computed, but must be shown qualified. */}
      {d.warnings.length > 0 && (
        <Stack space={1}>
          {d.warnings.map((code) => (
            <Text key={code} variant="small">
              {t.warnings[code as keyof typeof t.warnings] ?? code}
            </Text>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
