/**
 * Config key holding the allowed gender base-salary difference (%).
 *
 * Canonical definition. It is not just the row every outlier-detection caller
 * reads — it is the switch that turns the ratchet in `ConfigService.updateByKey`
 * on, so a mistyped copy would silently disable the only guard against raising
 * the national threshold. Import it, never restate it.
 */
export const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'
