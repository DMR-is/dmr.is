/**
 * Y-axis upper bound for the salary-by-score chart.
 *
 * ## Why this exists
 *
 * Both renderers used to round the maximum up to the nearest **100 000**, which
 * was reasonable for FTE-adjusted monthly salaries (~650 000 → a 700 000 axis).
 * On reglulegt tímakaup it is catastrophic: an observed ~4 900 kr./klst. lands
 * every single point in the bottom 5% of one band, with all five ticks reading
 * 0 / 25.000 / 50.000 / 75.000 / 100.000. The chart looks broken before anyone
 * questions the numbers.
 *
 * So the bound is derived from the data's own magnitude instead of a fixed step,
 * and works unchanged whether the values are thousands per hour or millions per
 * month.
 *
 * ## ⚠️ Mirrored in the web client
 *
 * `SalaryDistributionChart.tsx` carries a deliberate copy — the admin Recharts
 * component and this PDF renderer must agree, or the same report shows two
 * different axes depending on where you look at it. There is no shared lib
 * between the two apps for this, and the pre-existing code already mirrored the
 * axis logic by hand (see `salary-chart-svg.ts`). **Change both together.**
 *
 * ## The step ladder
 *
 * Multipliers are chosen so that dividing by 4 (the renderers draw five ticks:
 * 0, ¼, ½, ¾, max) never produces awkward labels, and so the data fills a decent
 * share of the plot rather than hugging the floor:
 *
 * | data max | axis max | data fills |
 * |---|---|---|
 * | 4 900 | 5 000 | 98% |
 * | 14 550 | 15 000 | 97% |
 * | 650 000 | 750 000 | 87% |
 */
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10] as const

export function niceAxisMax(dataMax: number): number {
  if (!Number.isFinite(dataMax) || dataMax <= 0) return 1

  const magnitude = 10 ** Math.floor(Math.log10(dataMax))
  const normalised = dataMax / magnitude
  const step = NICE_STEPS.find((candidate) => normalised <= candidate) ?? 10

  return step * magnitude
}
