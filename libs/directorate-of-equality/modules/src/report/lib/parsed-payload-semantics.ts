/**
 * Cross-field semantics of an assembled scoring payload.
 *
 * Lifted out of `report-excel/validators/semantic.validator.ts`, where these
 * rules could only ever run on a workbook. They are not workbook rules — they
 * are what makes a salary report mean anything:
 *
 * - The four mandatory Jafnréttisstofa criterion types must all be present. A
 *   report missing RESPONSIBILITY, STRAIN, CONDITION or COMPETENCE is not a
 *   salary report.
 * - Weights must add up — top-level criteria to 100%, and sub-criteria to 100%
 *   flat across the whole report, not per parent. That is how the template is
 *   built and how the scoring formula's "10% = 100 points" rule survives.
 * - Classifications must be **complete**: every role assigned a step on every
 *   job-based sub-criterion, every employee on every personal one.
 *
 * That last rule is why these belong on every path rather than the import one.
 * An employee's score is the plain sum of the step scores assigned to them
 * (`computeEmployeeScores`), so a missing assignment does not fail — it lowers
 * the score, silently. The score is that employee's x-coordinate in the
 * wage-gap regression, so an omission during field mapping moves them along it
 * and decides whether they are flagged as an outlier. Nothing downstream can
 * tell that apart from a real pay difference.
 *
 * Structural correctness — could every value be read, is it in range for its
 * type — is not here. On the Excel path the parser has already established it;
 * on a JSON payload `class-validator` has. What is left is what only makes
 * sense once the whole tree is assembled.
 */

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import {
  ParsedCriterionDto,
  ParsedEmployeeDto,
  ParsedReportDto,
  ParsedRoleDto,
  ParsedStepAssignmentDto,
  ParsedSubCriterionDto,
} from '../../report-excel/dto/parsed-report.dto'
import {
  MANDATORY_JOB_BASED_CRITERIA,
  MAX_PERSONAL_CRITERIA,
} from '../../report-excel/workbook.schema'
import {
  employeeLabel,
  PayloadIssueBag,
  PayloadIssueScope,
  roleLabel,
  subCriterionLabel,
} from './parsed-payload-issues'

/**
 * Tolerance for floating-point weight-sum comparisons. User-entered
 * percentages arrive as integers in practice (15, 25, …), but sub-weights
 * passed through arithmetic accumulate tiny FP errors. 0.01 is tighter than
 * the UI ever displays (1 decimal place) so anything this small is guaranteed
 * rounding noise, anything larger is a real authoring mistake.
 */
const WEIGHT_EPSILON = 0.01

const sum = (xs: readonly number[]): number => xs.reduce((acc, n) => acc + n, 0)

const approximately = (actual: number, expected: number): boolean =>
  Math.abs(actual - expected) <= WEIGHT_EPSILON

const checkMandatoryCriteriaPresent = (
  criteria: readonly ParsedCriterionDto[],
  issues: PayloadIssueBag,
): void => {
  const presentTypes = new Set(criteria.map((c) => c.type))
  for (const required of MANDATORY_JOB_BASED_CRITERIA) {
    if (!presentTypes.has(required)) {
      issues.add(
        PayloadIssueScope.CRITERIA,
        `Skyldubundið starfsbundið viðmið „${required}“ vantar — hver launagreining verður að innihalda öll fjögur`,
      )
    }
  }
}

const checkCriterionWeightsSumTo100 = (
  criteria: readonly ParsedCriterionDto[],
  issues: PayloadIssueBag,
): void => {
  if (criteria.length === 0) return
  const total = sum(criteria.map((c) => c.weight))
  if (!approximately(total, 100)) {
    issues.add(
      PayloadIssueScope.CRITERIA,
      `Vægi viðmiða leggst saman í ${total}%, á að vera 100%`,
    )
  }
}

const checkPersonalCriterionCount = (
  criteria: readonly ParsedCriterionDto[],
  issues: PayloadIssueBag,
): void => {
  const count = criteria.filter(
    (c) => c.type === ReportCriterionTypeEnum.PERSONAL,
  ).length
  if (count > MAX_PERSONAL_CRITERIA) {
    issues.add(
      PayloadIssueScope.CRITERIA,
      `Að hámarki ${MAX_PERSONAL_CRITERIA} einstaklingsbundið viðmið er leyft; fjöldi var ${count}`,
    )
  }
}

const checkSubCriterionWeightsSumTo100 = (
  criteria: readonly ParsedCriterionDto[],
  issues: PayloadIssueBag,
): void => {
  const allSubs = criteria.flatMap((c) => c.subCriteria)
  if (allSubs.length === 0 && criteria.length === 0) return
  const total = sum(allSubs.map((s) => s.weight))
  if (!approximately(total, 100)) {
    issues.add(
      PayloadIssueScope.SUB_CRITERIA,
      `Vægi undirviðmiða leggst saman í ${total}%, á að vera 100%`,
    )
  }
}

const checkMinimumPopulation = (
  report: ParsedReportDto,
  issues: PayloadIssueBag,
): void => {
  if (report.roles.length === 0) {
    issues.add(
      PayloadIssueScope.ROLES,
      'Að minnsta kosti eitt starf er nauðsynlegt',
    )
  }
  if (report.employees.length === 0) {
    issues.add(
      PayloadIssueScope.EMPLOYEES,
      'Að minnsta kosti einn starfsmaður er nauðsynlegur',
    )
  }
}

/**
 * Composite Map key over a criterion/sub-criterion pair.
 *
 * NUL separates, because it is the one byte that cannot occur in either title.
 * Written as the `\0` escape rather than the literal byte it used to be: the
 * raw byte made this file register as binary, which meant `grep` and `rg`
 * skipped it silently and every rule in here was invisible to code search.
 */
type SubKey = string
const subKey = (criterionTitle: string, subTitle: string): SubKey =>
  `${criterionTitle}\0${subTitle}`

const splitSubKey = (key: SubKey): [string, string] => {
  const [criterionTitle, subTitle] = key.split('\0')
  return [criterionTitle, subTitle]
}

const collectSubsByKey = (
  criteria: readonly ParsedCriterionDto[],
  filter: (c: ParsedCriterionDto) => boolean,
): Map<SubKey, ParsedSubCriterionDto> => {
  const map = new Map<SubKey, ParsedSubCriterionDto>()
  for (const c of criteria) {
    if (!filter(c)) continue
    for (const s of c.subCriteria) {
      map.set(subKey(c.title, s.title), s)
    }
  }
  return map
}

const checkAssignmentsComplete = (
  ownerLabel: string,
  assignments: readonly ParsedStepAssignmentDto[],
  expectedSubs: ReadonlyMap<SubKey, ParsedSubCriterionDto>,
  scope: PayloadIssueScope,
  issues: PayloadIssueBag,
  ordinal?: number,
): void => {
  const seen = new Map<SubKey, number>()
  for (const a of assignments) {
    const key = subKey(a.criterionTitle, a.subTitle)
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }

  for (const [key, count] of seen) {
    const [criterionTitle, subTitle] = splitSubKey(key)
    if (count > 1) {
      issues.add(
        scope,
        `${ownerLabel}: ${count} úthlutanir fyrir „${subCriterionLabel(
          criterionTitle,
          subTitle,
        )}“; á að vera nákvæmlega 1`,
        { ordinal },
      )
    }
    if (!expectedSubs.has(key)) {
      issues.add(
        scope,
        `${ownerLabel}: vísar í óþekkt undirviðmið „${subCriterionLabel(
          criterionTitle,
          subTitle,
        )}“`,
        { ordinal },
      )
    }
  }

  for (const [key, sub] of expectedSubs) {
    if (!seen.has(key)) {
      const [criterionTitle] = splitSubKey(key)
      issues.add(
        scope,
        `${ownerLabel}: vantar úthlutun fyrir „${subCriterionLabel(
          criterionTitle,
          sub.title,
        )}“`,
        { ordinal },
      )
    }
  }
}

const checkRoleClassificationsComplete = (
  criteria: readonly ParsedCriterionDto[],
  roles: readonly ParsedRoleDto[],
  issues: PayloadIssueBag,
): void => {
  const jobBasedSubs = collectSubsByKey(
    criteria,
    (c) => c.type !== ReportCriterionTypeEnum.PERSONAL,
  )
  for (const role of roles) {
    // The multiplicative loop. Building messages nobody will read is the cost
    // this guards — see `MAX_ISSUES`.
    if (issues.isFull) {
      return
    }

    checkAssignmentsComplete(
      roleLabel(role.title),
      role.stepAssignments,
      jobBasedSubs,
      PayloadIssueScope.ROLE_CLASSIFICATION,
      issues,
    )
  }
}

const checkEmployeeClassificationsComplete = (
  criteria: readonly ParsedCriterionDto[],
  employees: readonly ParsedEmployeeDto[],
  issues: PayloadIssueBag,
): void => {
  const personalSubs = collectSubsByKey(
    criteria,
    (c) => c.type === ReportCriterionTypeEnum.PERSONAL,
  )
  for (const emp of employees) {
    if (issues.isFull) {
      return
    }

    checkAssignmentsComplete(
      employeeLabel(emp.ordinal),
      emp.personalStepAssignments,
      personalSubs,
      PayloadIssueScope.EMPLOYEE_CLASSIFICATION,
      issues,
      emp.ordinal,
    )
  }
}

/**
 * Every cross-field rule, accumulated. Pure — it inspects and reports, and
 * decides nothing about how the caller answers.
 */
export const collectParsedPayloadSemantics = (
  report: ParsedReportDto,
  issues: PayloadIssueBag,
): void => {
  checkMandatoryCriteriaPresent(report.criteria, issues)
  checkPersonalCriterionCount(report.criteria, issues)
  checkCriterionWeightsSumTo100(report.criteria, issues)
  checkSubCriterionWeightsSumTo100(report.criteria, issues)
  checkMinimumPopulation(report, issues)
  checkRoleClassificationsComplete(report.criteria, report.roles, issues)
  checkEmployeeClassificationsComplete(
    report.criteria,
    report.employees,
    issues,
  )
}
