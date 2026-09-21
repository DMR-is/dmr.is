import { sharedText } from '../../lib/text'

export type ReportFilterOption = { value: string; label: string }

/**
 * The two things a company files. The whole taxonomy — the retired
 * vottun/staðfesting split is not part of it, and `IMPROVEMENT_PLAN` (which
 * the vinnslusvæði filter offers as a third pseudo-type mapping to
 * `hasImprovementPlan`) is deliberately absent here: an úrbótaáætlun is a
 * state OF a skýrslugjöf, not a kind of filing, and the export carries it as
 * its own column instead.
 */
export const REPORT_TYPE_OPTIONS: ReportFilterOption[] = [
  { value: 'EQUALITY', label: sharedText.typeLabels.EQUALITY },
  { value: 'SALARY', label: sharedText.typeLabels.SALARY },
]

/**
 * Where the jafnréttisáætlun behind a report came from. LEGACY means an
 * unexpired certification carried over from the retired register rather than a
 * plan filed here — worth being able to count, because that cohort shrinks
 * every year and the figures change as it does.
 */
export const EQUALITY_SOURCE_OPTIONS: ReportFilterOption[] = [
  { value: 'REPORT', label: 'Skráð í þessu kerfi' },
  { value: 'LEGACY', label: 'Úr eldra kerfi' },
]

/**
 * Gender of the company executive, as stated on the report.
 *
 * Frozen at submission like the rest of the filing — this says who signed off
 * on THAT report, not who holds the post today.
 */
export const ADMIN_GENDER_OPTIONS: ReportFilterOption[] = [
  { value: 'MALE', label: sharedText.genders.male },
  { value: 'FEMALE', label: sharedText.genders.female },
  { value: 'NEUTRAL', label: sharedText.genders.neutral },
]

/**
 * Pay-gap bounds in 0,5-point steps, 0 to 15+.
 *
 * Offered as two bounded selects (frá / til) rather than 31 checkboxes: an
 * admin asks for "5% and up" or "between 2 and 4", and a bucket list makes the
 * common questions the awkward ones. Picking the same value in both gives a
 * single band.
 *
 * The top option has no upper bound — 15 is where the scale stops, not where
 * the data does.
 */
export const GAP_BOUND_OPTIONS: ReportFilterOption[] = [
  { value: '0', label: 'Enginn launamunur (0%)' },
  ...Array.from({ length: 30 }, (_, index) => {
    const value = (index + 1) * 0.5
    return {
      value: String(value),
      label: `${String(value).replace('.', ',')}%`,
    }
  }),
]

/**
 * Whether the filing carries an úrbótaáætlun.
 *
 * A two-option multi-select rather than a checkbox: picking neither means no
 * constraint, and picking both means the same thing. A checkbox would make
 * "unchecked" ambiguous between "don't care" and "only those without one",
 * which are different queries against the same data.
 */
export const IMPROVEMENT_PLAN_OPTIONS: ReportFilterOption[] = [
  { value: 'yes', label: 'Með úrbótaáætlun' },
  { value: 'no', label: 'Án úrbótaáætlunar' },
]
