import {
  type DetectedOutlier,
  detectOutliers,
  getRegularHourlyWage,
  type OutlierDetectionEmployee,
  resolveAllowedDifferencePercent,
} from '../../report/lib/compensation-aggregates'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '../../report/lib/employee-scores'
import {
  computeAdditionalSalary,
  computeBonusSalary,
} from '../../report-employee/models/report-employee.model'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import {
  SalaryAnalysisOutlierDirectionEnum,
  SalaryAnalysisOutlierDto,
  SalaryAnalysisResponseDto,
} from '../dto/salary-analysis.response.dto'
import {
  buildChartFromEmployeePoints,
  type EmployeeDataPoint,
} from './build-chart'

/**
 * Runs outlier detection + the gender/score chart over a parsed workbook
 * payload, WITHOUT persisting anything. Pure function — the caller supplies the
 * already-resolved threshold percent (read from config). Shared by the
 * applicant portal preview and the admin create-flow preview so both agree with
 * the submit endpoint's server-side detection (all paths funnel through the
 * canonical `computeEmployeeScores` + `detectOutliers`).
 */
export function analyzeSalaryPayload(
  parsed: ParsedReportDto,
  thresholdPercent: number,
): SalaryAnalysisResponseDto {
  // 1. Integrity-check the parsed payload (rejects malformed input) and
  //    capture the step-score lookup map.
  const stepScoreByKey = assertParsedPayloadIntegrity(parsed)

  // 2. Compute per-employee total scores using the same dedup'd Set logic the
  //    submit endpoint uses, so preview and submit agree on score.
  const employeeScores = computeEmployeeScores(parsed, stepScoreByKey)

  // 3. Pair each parsed employee with its computed score and ordinal so
  //    detectOutliers can return outlier rows referenced by ordinal.
  const detectionEmployees: OutlierDetectionEmployee[] = parsed.employees.map(
    (employee, index) => ({
      ordinal: employee.ordinal,
      score: employeeScores[index],
      gender: employee.gender,
      paidHours: employee.paidHours,
      baseSalary: employee.baseSalary,
      additionalSalary: computeAdditionalSalary(employee),
      bonusSalary: computeBonusSalary(employee),
    }),
  )

  // 4. Detect outliers using the canonical helper.
  const detected = detectOutliers({
    employees: detectionEmployees,
    thresholdPercent,
  })

  // 5. Build the chart half of the response from the same employee/score
  //    mapping the reviewer-side getRegularHourlyWageByScoreAll uses.
  const chartPoints: EmployeeDataPoint[] = detectionEmployees.map(
    (employee) => ({
      score: employee.score,
      regularHourlyWage: getRegularHourlyWage(employee),
      gender: employee.gender,
    }),
  )
  const regularHourlyWageByScoreAll = buildChartFromEmployeePoints(
    chartPoints,
    resolveAllowedDifferencePercent(thresholdPercent),
  )

  return {
    outliers: detected.map(toOutlierDto),
    regularHourlyWageByScoreAll,
  }
}

function toOutlierDto(detected: DetectedOutlier): SalaryAnalysisOutlierDto {
  // detectOutliers only emits rows where isOutlier=true, which guarantees
  // a non-null direction and non-null differencePercent (see the assessment
  // in compensation-aggregates.ts).
  const { assessment } = detected

  // 2dp, not whole krónur. Rounding to 1 kr is 8×10⁻⁷ relative on a 650.000
  // monthly salary but 2×10⁻⁴ on a ~4.000 kr./klst. rate, and the error
  // compounds when percentages are derived from already-rounded figures.
  const round2 = (value: number): number => Math.round(value * 100) / 100

  return {
    employeeOrdinal: detected.ordinal,
    regularHourlyWage: round2(detected.regularHourlyWage),
    predictedHourlyWage: round2(detected.predictedHourlyWage),
    scoreBucketRangeFrom: detected.scoreBucketRangeFrom,
    scoreBucketRangeTo: detected.scoreBucketRangeTo,
    direction:
      (assessment.direction as SalaryAnalysisOutlierDirectionEnum | null) ??
      SalaryAnalysisOutlierDirectionEnum.EQUAL,
    differencePercent: assessment.differencePercent ?? 0,
    allowedDifferencePercent: assessment.allowedDifferencePercent,
  }
}
