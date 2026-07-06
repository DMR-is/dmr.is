import {
  type DetectedOutlier,
  detectOutliers,
  type OutlierDetectionEmployee,
  resolveAllowedDifferencePercent,
} from '../../report/lib/compensation-aggregates'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '../../report/lib/employee-scores'
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
 * Config key for the salary-difference threshold percent, shared by every
 * caller that runs outlier detection so preview and submit read the same knob.
 */
export const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'

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
      workRatio: employee.workRatio,
      baseSalary: employee.baseSalary,
    }),
  )

  // 4. Detect outliers using the canonical helper.
  const detected = detectOutliers({
    employees: detectionEmployees,
    thresholdPercent,
  })

  // 5. Build the chart half of the response from the same employee/score
  //    mapping the reviewer-side getBaseSalaryByGenderAndScoreAll uses.
  const chartPoints: EmployeeDataPoint[] = detectionEmployees.map(
    (employee) => ({
      score: employee.score,
      adjustedSalary: employee.baseSalary / employee.workRatio,
      gender: employee.gender,
    }),
  )
  const baseSalaryByGenderAndScoreAll = buildChartFromEmployeePoints(
    chartPoints,
    resolveAllowedDifferencePercent(thresholdPercent),
  )

  return {
    outliers: detected.map(toOutlierDto),
    baseSalaryByGenderAndScoreAll,
  }
}

function toOutlierDto(detected: DetectedOutlier): SalaryAnalysisOutlierDto {
  // detectOutliers only emits rows where isOutlier=true, which guarantees
  // a non-null direction and non-null differencePercent (see the assessment
  // in compensation-aggregates.ts).
  const { assessment } = detected

  return {
    employeeOrdinal: detected.ordinal,
    adjustedBaseSalary: Math.round(detected.adjustedBaseSalary),
    predictedBaseSalary: Math.round(detected.predictedBaseSalary),
    scoreBucketRangeFrom: detected.scoreBucketRangeFrom,
    scoreBucketRangeTo: detected.scoreBucketRangeTo,
    direction:
      (assessment.direction as SalaryAnalysisOutlierDirectionEnum | null) ??
      SalaryAnalysisOutlierDirectionEnum.EQUAL,
    differencePercent: assessment.differencePercent ?? 0,
    allowedDifferencePercent: assessment.allowedDifferencePercent,
  }
}
