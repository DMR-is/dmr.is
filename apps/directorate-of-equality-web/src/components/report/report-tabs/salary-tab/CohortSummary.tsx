import { Text } from '@dmr.is/ui/components/island-is/Text'

import { type SalaryTotalsDto } from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'

const t = reportText.salaryTab.cohort

interface CohortSummaryProps {
  totals: SalaryTotalsDto
}

/**
 * How many employees the figures below rest on, with the gender split.
 *
 * Sits above the chart because it frames everything under it: a gap computed
 * over 6 people and one computed over 600 warrant different confidence, and
 * nothing else on the page states the cohort size. It is the first thing a
 * reviewer needs and was previously only inferable by counting scatter points.
 *
 * ⚠️ **This is the analysed cohort, not a company headcount** — hence
 * "Starfsmenn í greiningu" rather than "Starfsmannafjöldi". The two are usually
 * the same number, but nothing in the schema guarantees it: the only
 * company-level figure DMR holds is `employeeCountCategory`, a bucket (0–24 /
 * 25–49 / 50+), so a real headcount cannot be printed here even where it would
 * be wanted. Labelling this as the company's staff count would be a claim the
 * data does not support.
 *
 * Read off `totals` rather than `report.result`, so it renders for any report
 * whose chart renders — the frozen snapshot carries a three-way count, but only
 * per score bucket, and only once a result exists.
 */
export const CohortSummary = ({ totals }: CohortSummaryProps) => {
  // femaleCount already includes NEUTRAL: the API bundles M vs F+N before it
  // counts, so this total is the whole cohort and needs no third term.
  const total = totals.maleCount + totals.femaleCount

  if (total === 0) return null

  // One line, not a labelled stack: this is context for the chart it sits
  // under, so it must not compete with the analysis figures for attention.
  return (
    <Text variant="small" color="dark300">
      {`${t.label}: ${total}${t.separator}${totals.maleCount} ${t.male}${t.separator}${totals.femaleCount} ${t.female}`}
      {` — ${t.hint}`}
    </Text>
  )
}
