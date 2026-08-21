import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '../../report/lib/employee-scores'
import {
  computeWageGapDecomposition,
  roundWageGapDecompositionSnapshot,
  type WageGapEmployeeInput,
} from '../../report/lib/wage-gap-decomposition'
import { parsedRegularHourlyWage } from '../../report-employee/models/report-employee.model'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import { SalaryAnalysisResponseDto } from '../dto/salary-analysis.response.dto'
import {
  buildChartFromEmployeePoints,
  type EmployeeDataPoint,
} from './build-chart'
import { toMinimumSetDtos } from './minimum-set'

/**
 * Runs the salary analysis over a parsed workbook payload, WITHOUT persisting
 * anything. Pure function — the caller supplies the already-resolved benchmark
 * percent (read from config). Shared by the applicant portal preview and the
 * admin create-flow preview so both agree with the submit endpoint (all paths
 * funnel through the canonical `computeEmployeeScores` +
 * `computeWageGapDecomposition`).
 *
 * One decomposition drives everything returned here: the two gap figures, and
 * the lágmarksmengi that the úrbótaáætlun is built from. There is no separate
 * per-employee outlier rule any more — see `selectMinimumSet`.
 *
 * ⚠️ This file used to re-export `SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY` for
 * the outlier-detection callers that imported it from here. Those callers are
 * gone with the band, and the key now has one home in
 * `config/config.constants.ts` — reach for it there, or for a validated read,
 * `readNumericConfig` in `config/lib/numeric-config.ts`.
 */
export function analyzeSalaryPayload(
  parsed: ParsedReportDto,
  benchmarkPercent: number,
): SalaryAnalysisResponseDto {
  // 1. Integrity-check the parsed payload (rejects malformed input) and
  //    capture the step-score lookup map.
  const stepScoreByKey = assertParsedPayloadIntegrity(parsed)

  // 2. Compute per-employee total scores using the same dedup'd Set logic the
  //    submit endpoint uses, so preview and submit agree on score.
  const employeeScores = computeEmployeeScores(parsed, stepScoreByKey)

  // 3. Pair each parsed employee with its score and its reglulegt tímakaup.
  //    Derived ONCE — the chart and the decomposition both read it, and deriving
  //    it twice is how two figures on one screen start disagreeing.
  const employees: WageGapEmployeeInput[] = parsed.employees.map(
    (employee, index) => ({
      ordinal: employee.ordinal,
      score: employeeScores[index],
      gender: employee.gender,
      // Quantized to storage precision, so the previewed figures are the ones
      // `report_result` will freeze at submit rather than merely close to them.
      hourlyWage: parsedRegularHourlyWage(employee),
    }),
  )

  // 4. The decomposition. Rounded with the persistence defaults, so the
  //    previewed leiðréttur launamunur is byte-for-byte the figure
  //    `report_result` will freeze at submit — same rounding, same benchmark,
  //    same cohort.
  const wageGapDecomposition = roundWageGapDecompositionSnapshot(
    computeWageGapDecomposition({ employees, benchmarkPercent }),
  )

  // 5. The chart, from the same rows. Descriptive only — no tolerance band,
  //    because no per-employee band decides anything now.
  const chartPoints: EmployeeDataPoint[] = employees.map((employee) => ({
    score: employee.score,
    regularHourlyWage: employee.hourlyWage,
    gender: employee.gender,
  }))

  return {
    outliers: toMinimumSetDtos(wageGapDecomposition),
    regularHourlyWageByScoreAll: buildChartFromEmployeePoints(chartPoints),
    wageGapDecomposition,
  }
}
